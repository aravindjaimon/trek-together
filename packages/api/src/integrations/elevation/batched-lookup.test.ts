import { describe, expect, it, vi } from "vitest";
import { batchedLookup } from "./batched-lookup";
import type { ElevationPoint, ElevationProvider, LatLng } from "./types";

/** A fake provider that echoes each point back with elevation = its index-free lat. */
function echoProvider(): ElevationProvider & { lookup: ReturnType<typeof vi.fn> } {
  const lookup = vi.fn(
    async (points: LatLng[]): Promise<ElevationPoint[]> =>
      points.map((p) => ({ lat: p.lat, lng: p.lng, elevationM: p.lat, dataset: "test" })),
  );
  return { lookup };
}

describe("batchedLookup", () => {
  it("returns [] without calling the provider for empty input", async () => {
    const provider = echoProvider();
    expect(await batchedLookup(provider, [], { minIntervalMs: 0 })).toEqual([]);
    expect(provider.lookup).toHaveBeenCalledTimes(0);
  });

  it("splits >100 points into ≤100-point requests (101 → 2 calls)", async () => {
    const provider = echoProvider();
    const points: LatLng[] = Array.from({ length: 101 }, (_, i) => ({ lat: i, lng: 0 }));

    await batchedLookup(provider, points, { minIntervalMs: 0 });

    expect(provider.lookup).toHaveBeenCalledTimes(2);
    expect((provider.lookup.mock.calls[0][0] as LatLng[]).length).toBe(100);
    expect((provider.lookup.mock.calls[1][0] as LatLng[]).length).toBe(1);
  });

  it("merges results back in the original input order across batches", async () => {
    const provider = echoProvider();
    const points: LatLng[] = Array.from({ length: 101 }, (_, i) => ({ lat: i, lng: 0 }));

    const result = await batchedLookup(provider, points, { batchSize: 100, minIntervalMs: 0 });

    expect(result).toHaveLength(101);
    expect(result.map((p) => p.lat)).toEqual(points.map((p) => p.lat));
  });

  it("spaces outbound batches ≥ minIntervalMs apart", async () => {
    vi.useFakeTimers();
    const startedAt: number[] = [];
    const provider: ElevationProvider = {
      lookup: async (points) => {
        startedAt.push(Date.now());
        return points.map((p) => ({ lat: p.lat, lng: p.lng, elevationM: 0, dataset: "test" }));
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
});
