import { describe, expect, it, vi } from "vitest";
import type { ElevationCacheRepo, ElevationCacheRow } from "../../data/elevation-cache.repo";
import { createElevationService } from "./cache";
import { cacheKey, quantise } from "./quantise";
import {
  type ElevationPoint,
  ElevationProviderError,
  ElevationUnavailableError,
  type LatLng,
} from "./types";

function inMemoryRepo() {
  const store = new Map<string, ElevationCacheRow>();
  const findByKeys = vi.fn(async (keys: string[]) => {
    const found = new Map<string, ElevationCacheRow>();
    for (const key of keys) {
      const row = store.get(key);
      if (row) found.set(key, row);
    }
    return found;
  });
  const upsertMany = vi.fn(async (rows: ElevationCacheRow[]) => {
    for (const row of rows) store.set(row.key, row);
  });
  const repo: ElevationCacheRepo = { findByKeys, upsertMany };
  return { repo, store, findByKeys, upsertMany };
}

/** Provider that echoes each point with elevation = round(lat), counting calls. */
function countingProvider() {
  const lookup = vi.fn(
    async (points: LatLng[]): Promise<ElevationPoint[]> =>
      points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        elevationM: Math.round(p.lat),
        dataset: "srtm30m",
      })),
  );
  return { lookup };
}

function makeService(repo: ElevationCacheRepo, provider: { lookup: ReturnType<typeof vi.fn> }) {
  return createElevationService({
    repo,
    provider,
    datasetNamespace: "srtm30m",
    minIntervalMs: 0,
  });
}

const p1: LatLng = { lat: 10, lng: 20 };
const p2: LatLng = { lat: 11, lng: 21 };

describe("createElevationService.getElevations", () => {
  it("cold: fetches all misses, writes them through, maps to input order", async () => {
    const { repo, store } = inMemoryRepo();
    const provider = countingProvider();
    const service = makeService(repo, provider);

    const { points, stats } = await service.getElevations([p1, p2]);

    expect(provider.lookup).toHaveBeenCalledTimes(1);
    expect(stats).toEqual({ hits: 0, misses: 2 });
    expect(points.map((p) => p.elevationM)).toEqual([10, 11]);
    expect(points.map((p) => ({ lat: p.lat, lng: p.lng }))).toEqual([p1, p2]);
    expect(store.size).toBe(2);
  });

  it("warm: a second identical call performs ZERO provider requests", async () => {
    const { repo } = inMemoryRepo();
    const provider = countingProvider();
    const service = makeService(repo, provider);

    await service.getElevations([p1, p2]);
    provider.lookup.mockClear();

    const { points, stats } = await service.getElevations([p1, p2]);

    expect(provider.lookup).toHaveBeenCalledTimes(0);
    expect(stats).toEqual({ hits: 2, misses: 0 });
    expect(points.map((p) => p.elevationM)).toEqual([10, 11]);
  });

  it("partial: fetches only the missing key when one is already cached", async () => {
    const { repo } = inMemoryRepo();
    const provider = countingProvider();
    const service = makeService(repo, provider);

    await service.getElevations([p1]); // prime p1
    provider.lookup.mockClear();

    const { stats } = await service.getElevations([p1, p2]);

    expect(provider.lookup).toHaveBeenCalledTimes(1);
    expect((provider.lookup.mock.calls[0][0] as LatLng[]).length).toBe(1); // only the miss
    expect(stats).toEqual({ hits: 1, misses: 1 });
  });

  it("dedupes points that collapse to the same key within one request", async () => {
    const { repo } = inMemoryRepo();
    const provider = countingProvider();
    const service = makeService(repo, provider);

    // Two inputs < half a grid step apart → same cache key.
    const { points, stats } = await service.getElevations([
      { lat: 10.0, lng: 20.0 },
      { lat: 10.0001, lng: 20.0001 },
    ]);

    expect((provider.lookup.mock.calls[0][0] as LatLng[]).length).toBe(1);
    expect(stats).toEqual({ hits: 0, misses: 1 });
    expect(points).toHaveLength(2);
    expect(points[0].elevationM).toBe(points[1].elevationM);
  });

  it("treats a cached null (out-of-bounds) as a hit, not a re-fetch", async () => {
    const { repo, store } = inMemoryRepo();
    const provider = countingProvider();
    const service = makeService(repo, provider);

    const sea: LatLng = { lat: 0, lng: 0 };
    const q = quantise(sea);
    const key = cacheKey("srtm30m", q);
    store.set(key, {
      key,
      lat: q.lat,
      lng: q.lng,
      elevationM: null,
      dataset: "srtm30m",
      source: "srtm30m",
    });

    const { points, stats } = await service.getElevations([sea]);

    expect(provider.lookup).toHaveBeenCalledTimes(0);
    expect(stats).toEqual({ hits: 1, misses: 0 });
    expect(points[0].elevationM).toBeNull();
  });
});

/** Provider that always fails with a typed provider error. */
function failingProvider(provider = "opentopodata") {
  return {
    lookup: vi.fn(async (): Promise<ElevationPoint[]> => {
      throw new ElevationProviderError("quota exceeded", { provider, status: 429 });
    }),
  };
}

describe("createElevationService fallback + graceful degradation", () => {
  it("falls back to the secondary provider and logs the switch with the request id", async () => {
    const { repo } = inMemoryRepo();
    const primary = failingProvider("opentopodata");
    const secondary = countingProvider();
    const logs: string[] = [];
    const service = createElevationService({
      repo,
      provider: primary,
      fallbackProvider: secondary,
      datasetNamespace: "srtm30m",
      minIntervalMs: 0,
      requestId: "req-1",
      logger: (m) => logs.push(m),
    });

    const { points } = await service.getElevations([p1]);

    expect(primary.lookup).toHaveBeenCalled();
    expect(secondary.lookup).toHaveBeenCalledTimes(1);
    expect(points[0].elevationM).toBe(10);
    expect(logs.some((l) => l.includes("req-1"))).toBe(true);
  });

  it("both providers fail: throws a user-safe ELEVATION_UNAVAILABLE with the cached partial", async () => {
    const { repo } = inMemoryRepo();
    // Prime p1 with a working provider so it is a cache hit later.
    await makeService(repo, countingProvider()).getElevations([p1]);

    const service = createElevationService({
      repo,
      provider: failingProvider("opentopodata"),
      fallbackProvider: failingProvider("open-elevation"),
      datasetNamespace: "srtm30m",
      minIntervalMs: 0,
      logger: () => {},
    });

    const error = await service.getElevations([p1, p2]).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ElevationUnavailableError);
    const unavailable = error as ElevationUnavailableError;
    expect(unavailable.code).toBe("ELEVATION_UNAVAILABLE");
    expect(unavailable.unresolvedCount).toBe(1); // p2
    expect(unavailable.resolved.map((p) => p.elevationM)).toEqual([10]); // p1 from cache
    expect(unavailable.message).not.toMatch(/quota|429/); // no upstream detail leaked
  });

  it("does not fall back when fallback is disabled", async () => {
    const { repo } = inMemoryRepo();
    const secondary = countingProvider();
    const service = createElevationService({
      repo,
      provider: failingProvider("opentopodata"),
      fallbackProvider: secondary,
      fallbackEnabled: false,
      datasetNamespace: "srtm30m",
      minIntervalMs: 0,
      logger: () => {},
    });

    await expect(service.getElevations([p1])).rejects.toBeInstanceOf(ElevationUnavailableError);
    expect(secondary.lookup).not.toHaveBeenCalled();
  });
});
