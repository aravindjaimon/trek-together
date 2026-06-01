import { describe, expect, it, vi } from "vitest";
import type { LatLng } from "../integrations/elevation/types";
import { buildProfile } from "./elevation-profile";

function fakeElevationClient(elevations: (number | null)[]) {
  return {
    getElevations: vi.fn(async (points: LatLng[]) => ({
      points: points.map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        elevationM: i < elevations.length ? elevations[i] : 0,
        dataset: "test",
      })),
      stats: { hits: 0, misses: points.length },
    })),
  };
}

describe("buildProfile", () => {
  it("returns empty profile for empty path", async () => {
    const client = fakeElevationClient([]);
    const result = await buildProfile([], client);
    expect(result.profile).toEqual([]);
    expect(result.totalDistanceM).toBe(0);
    expect(client.getElevations).not.toHaveBeenCalled();
  });

  it("returns single point with elevation", async () => {
    const client = fakeElevationClient([500]);
    const result = await buildProfile([{ lat: 10, lng: 20 }], client);
    expect(result.profile).toHaveLength(1);
    expect(result.profile[0]).toMatchObject({
      lat: 10,
      lng: 20,
      elevationM: 500,
      distanceAlongM: 0,
    });
    expect(result.totalDistanceM).toBe(0);
  });

  it("zips elevations with cumulative distances", async () => {
    // Path ~1112 m at spacing 200 m → ~6 densified points
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.01 },
    ];
    // Each point gets elevation = index * 10
    const client = fakeElevationClient(Array.from({ length: 10 }, (_, i) => i * 10));

    const result = await buildProfile(path, client, 200);

    expect(result.profile.length).toBeGreaterThan(1);
    expect(result.totalDistanceM).toBeGreaterThan(0);
    // Verify elevation values are assigned
    for (let i = 0; i < result.profile.length; i++) {
      expect(result.profile[i].elevationM).toBe(i * 10);
    }
  });

  it("throws when elevation result length mismatches", async () => {
    const client = {
      getElevations: vi.fn(async () => ({
        points: [{ lat: 0, lng: 0, elevationM: 100, dataset: "test" }],
        stats: { hits: 0, misses: 1 },
      })),
    };
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.01 },
    ];
    await expect(buildProfile(path, client, 1000)).rejects.toThrow("length mismatch");
  });

  it("throws when elevation is null", async () => {
    const client = fakeElevationClient([null]);
    await expect(buildProfile([{ lat: 0, lng: 0 }], client)).rejects.toThrow(
      "Elevation unavailable",
    );
  });

  it("throws when elevation is NaN", async () => {
    const client = fakeElevationClient([Number.NaN]);
    await expect(buildProfile([{ lat: 0, lng: 0 }], client)).rejects.toThrow(/elevation is NaN/i);
  });

  it("distanceAlongM is non-decreasing", async () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0.01, lng: 0 },
      { lat: 0.01, lng: 0.01 },
    ];
    const client = fakeElevationClient(Array(50).fill(100));

    const result = await buildProfile(path, client, 500);

    for (let i = 1; i < result.profile.length; i++) {
      expect(result.profile[i].distanceAlongM).toBeGreaterThanOrEqual(
        result.profile[i - 1].distanceAlongM,
      );
    }
  });
});
