import { describe, expect, it } from "vitest";

import type { GetElevationsResult } from "../integrations/elevation/cache";
import type { LatLng } from "../integrations/elevation/types";
import { analyzeRoute, RouteTooLargeError } from "./analyze";
import type { ElevationClient } from "./elevation-profile";

/** Fake cache client: assigns each returned point an elevation via `elevationFor`. */
function fakeClient(
  elevationFor: (index: number) => number,
  stats = { hits: 0, misses: 0 },
): ElevationClient {
  return {
    async getElevations(points: LatLng[]): Promise<GetElevationsResult> {
      return {
        points: points.map((p, i) => ({
          lat: p.lat,
          lng: p.lng,
          elevationM: elevationFor(i),
          dataset: "test",
        })),
        stats,
      };
    },
  };
}

// Two points ~1.1 km apart (0.01° of latitude ≈ 1113 m).
const shortPath: LatLng[] = [
  { lat: 0, lng: 0 },
  { lat: 0.01, lng: 0 },
];

describe("analyzeRoute", () => {
  it("produces a flat-route analysis (no ascent → Easiest)", async () => {
    const result = await analyzeRoute(
      shortPath,
      fakeClient(() => 100),
      { spacingM: 100 },
    );

    expect(result.ascentM).toBe(0);
    expect(result.descentM).toBe(0);
    expect(result.difficultyBand).toBe("Easiest");
    expect(result.distanceM).toBeGreaterThan(1000);
    expect(result.elevationProfile.length).toBeGreaterThan(1);
    expect(result.elevationProfile[0]).toEqual({ distanceAlongM: 0, elevationM: 100 });
    expect(result.estTimeNaismithS).toBeGreaterThan(0);
  });

  it("accumulates ascent on a climbing route", async () => {
    // +10 m per sample point — survives the 3 m min-change smoothing threshold.
    const result = await analyzeRoute(
      shortPath,
      fakeClient((i) => 100 + i * 10),
      { spacingM: 100 },
    );

    expect(result.ascentM).toBeGreaterThan(0);
    expect(result.descentM).toBe(0);
    expect(result.difficultyScore).toBeGreaterThan(0);
  });

  it("surfaces cache stats as meta", async () => {
    const result = await analyzeRoute(
      shortPath,
      fakeClient(() => 50, { hits: 7, misses: 3 }),
      {
        spacingM: 100,
      },
    );

    expect(result.meta).toEqual({ cacheHits: 7, cacheMisses: 3 });
  });

  it("rejects routes that would exceed the sample-point ceiling", async () => {
    // ~1113 km at 10 m spacing ≈ 111k points, well over the limit.
    const hugePath: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 10, lng: 0 },
    ];
    await expect(
      analyzeRoute(
        hugePath,
        fakeClient(() => 0),
        { spacingM: 10 },
      ),
    ).rejects.toBeInstanceOf(RouteTooLargeError);
  });
});
