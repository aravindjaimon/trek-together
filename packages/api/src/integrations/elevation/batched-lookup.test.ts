import { describe, expect, it, vi } from "vitest";
import { batchedLookup } from "./batched-lookup";
import {
  type ElevationPoint,
  type ElevationProvider,
  ElevationProviderError,
  type LatLng,
} from "./types";

const echo = (p: LatLng): ElevationPoint => ({
  lat: p.lat,
  lng: p.lng,
  elevationM: p.lat,
  dataset: "test",
});

/**
 * A fake provider that echoes each point back with elevation = its lat. Each
 * fake gets a distinct name: the limiter registry is process-global, keyed by
 * provider name, so unique names keep tests' timing isolated.
 */
function echoProvider(name: string): ElevationProvider & { lookup: ReturnType<typeof vi.fn> } {
  const lookup = vi.fn(async (points: LatLng[]): Promise<ElevationPoint[]> => points.map(echo));
  return { name, lookup };
}

describe("batchedLookup", () => {
  it("returns [] without calling the provider for empty input", async () => {
    const provider = echoProvider("empty-input");
    expect(await batchedLookup(provider, [], { minIntervalMs: 0 })).toEqual([]);
    expect(provider.lookup).toHaveBeenCalledTimes(0);
  });

  it("splits >100 points into ≤100-point requests (101 → 2 calls)", async () => {
    const provider = echoProvider("splits");
    const points: LatLng[] = Array.from({ length: 101 }, (_, i) => ({ lat: i, lng: 0 }));

    await batchedLookup(provider, points, { minIntervalMs: 0 });

    expect(provider.lookup).toHaveBeenCalledTimes(2);
    expect((provider.lookup.mock.calls[0][0] as LatLng[]).length).toBe(100);
    expect((provider.lookup.mock.calls[1][0] as LatLng[]).length).toBe(1);
  });

  it("merges results back in the original input order across batches", async () => {
    const provider = echoProvider("merges");
    const points: LatLng[] = Array.from({ length: 101 }, (_, i) => ({ lat: i, lng: 0 }));

    const result = await batchedLookup(provider, points, { batchSize: 100, minIntervalMs: 0 });

    expect(result).toHaveLength(101);
    expect(result.map((p) => p.lat)).toEqual(points.map((p) => p.lat));
  });

  it("spaces outbound batches ≥ minIntervalMs apart", async () => {
    vi.useFakeTimers();
    const startedAt: number[] = [];
    const provider: ElevationProvider = {
      name: "spacing",
      lookup: async (points) => {
        startedAt.push(Date.now());
        return points.map(echo);
      },
    };
    const points: LatLng[] = Array.from({ length: 201 }, (_, i) => ({ lat: i, lng: 0 }));

    const run = batchedLookup(provider, points, { batchSize: 100, minIntervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(3000);
    await run;
    vi.useRealTimers();

    expect(startedAt).toHaveLength(3);
    expect(startedAt[1] - startedAt[0]).toBe(1000);
    expect(startedAt[2] - startedAt[1]).toBe(1000);
  });

  it("shares ONE rate-limit chain across concurrent lookups to the same provider (T10.6)", async () => {
    vi.useFakeTimers();
    const startedAt: number[] = [];
    const provider: ElevationProvider = {
      name: "shared-chain",
      lookup: async (points) => {
        startedAt.push(Date.now());
        return points.map(echo);
      },
    };

    // Two "concurrent users": with a per-call limiter these fired simultaneously.
    const a = batchedLookup(provider, [{ lat: 1, lng: 0 }], { minIntervalMs: 1000 });
    const b = batchedLookup(provider, [{ lat: 2, lng: 0 }], { minIntervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(2000);
    await Promise.all([a, b]);
    vi.useRealTimers();

    expect(startedAt).toHaveLength(2);
    expect(startedAt[1] - startedAt[0]).toBe(1000);
  });

  it("stops at the first hard failure — queued batches never fire (T10.6)", async () => {
    let calls = 0;
    const provider: ElevationProvider = {
      name: "fail-fast",
      lookup: async (points) => {
        calls += 1;
        if (calls === 2) {
          throw new ElevationProviderError("boom", { provider: "fail-fast", status: 500 });
        }
        return points.map(echo);
      },
    };
    const points: LatLng[] = Array.from({ length: 300 }, (_, i) => ({ lat: i, lng: 0 }));

    await expect(
      batchedLookup(provider, points, { batchSize: 100, minIntervalMs: 0 }),
    ).rejects.toBeInstanceOf(ElevationProviderError);
    expect(calls).toBe(2); // batch 3 never burned quota
  });

  it("retries a 429 exactly once, honouring Retry-After", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const timeline: number[] = [];
    const provider: ElevationProvider = {
      name: "retry-once",
      lookup: async (points) => {
        calls += 1;
        timeline.push(Date.now());
        if (calls === 1) {
          throw new ElevationProviderError("rate limited", {
            provider: "retry-once",
            status: 429,
            retryAfterS: 2,
          });
        }
        return points.map(echo);
      },
    };

    const run = batchedLookup(provider, [{ lat: 1, lng: 0 }], { minIntervalMs: 0 });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await run;
    vi.useRealTimers();

    expect(result).toHaveLength(1);
    expect(calls).toBe(2);
    expect(timeline[1] - timeline[0]).toBe(2000); // waited the full Retry-After
  });

  it("propagates typed when the single retry also fails", async () => {
    vi.useFakeTimers();
    const lookup = vi.fn(async (): Promise<ElevationPoint[]> => {
      throw new ElevationProviderError("still limited", { provider: "retry-fails", status: 429 });
    });
    const provider: ElevationProvider = { name: "retry-fails", lookup };

    const run = batchedLookup(provider, [{ lat: 1, lng: 0 }], { minIntervalMs: 0 }).catch(
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(1500); // default retry delay
    const err = await run;
    vi.useRealTimers();

    expect(err).toBeInstanceOf(ElevationProviderError);
    expect(lookup).toHaveBeenCalledTimes(2); // one retry, not a loop
  });

  it("does not retry non-retryable failures", async () => {
    const lookup = vi.fn(async (): Promise<ElevationPoint[]> => {
      throw new ElevationProviderError("bad response shape", {
        provider: "hard-fail",
        status: 500,
      });
    });
    const provider: ElevationProvider = { name: "hard-fail", lookup };

    await expect(
      batchedLookup(provider, [{ lat: 1, lng: 0 }], { minIntervalMs: 0 }),
    ).rejects.toBeInstanceOf(ElevationProviderError);
    expect(lookup).toHaveBeenCalledTimes(1);
  });
});
