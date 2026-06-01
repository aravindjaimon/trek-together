import { describe, expect, it } from "vitest";
import type { LatLng } from "../integrations/elevation/types";
import { densify, haversineM } from "./geo";

describe("haversineM", () => {
  it("returns 0 for identical points", () => {
    expect(haversineM({ lat: 45, lng: -73 }, { lat: 45, lng: -73 })).toBe(0);
  });

  it("computes ~111.2 km for 1 degree latitude", () => {
    const dist = haversineM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    // 1° latitude ≈ 111.2 km (±0.5% tolerance for spherical model)
    expect(dist).toBeCloseTo(111_200, -2);
  });

  it("computes ~111.2 km for 1 degree longitude at equator", () => {
    const dist = haversineM({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(dist).toBeCloseTo(111_200, -2);
  });

  it("computes ~0 for 1 degree longitude near pole", () => {
    const dist = haversineM({ lat: 89.9, lng: 0 }, { lat: 89.9, lng: 1 });
    expect(dist).toBeLessThan(200);
  });

  it("computes half the earth circumference for antipodal points", () => {
    const dist = haversineM({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    // Half circumference: π × 6,371,000 ≈ 20,015,089 m
    expect(dist).toBeCloseTo(Math.PI * 6_371_000, -2);
  });

  it("is commutative", () => {
    const a: LatLng = { lat: 51.5074, lng: -0.1278 };
    const b: LatLng = { lat: 48.8566, lng: 2.3522 };
    expect(haversineM(a, b)).toBeCloseTo(haversineM(b, a));
  });
});

describe("densify", () => {
  it("returns single point as-is with distanceAlongM 0", () => {
    const result = densify([{ lat: 10, lng: 20 }], 60);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ lat: 10, lng: 20, distanceAlongM: 0 });
  });

  it("returns empty array for empty input", () => {
    expect(densify([], 60)).toEqual([]);
  });

  it("preserves endpoints", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.01 }, // ~1112 m
    ];
    const result = densify(path, 60);
    expect(result[0].lat).toBe(0);
    expect(result[0].lng).toBe(0);
    const last = result[result.length - 1];
    expect(last.lat).toBe(0);
    expect(last.lng).toBe(0.01);
  });

  it("produces spacing ≤ target", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.01 },
    ];
    const result = densify(path, 200);
    for (let i = 1; i < result.length; i++) {
      const gap = haversineM(result[i - 1], result[i]);
      expect(gap).toBeLessThanOrEqual(210); // small tolerance
    }
  });

  it("no-ops when segment is shorter than spacing", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.0001 }, // ~11 m
    ];
    const result = densify(path, 60);
    expect(result).toHaveLength(2);
  });

  it("distanceAlongM is monotonically non-decreasing", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0.1, lng: 0 },
      { lat: 0.1, lng: 0.1 },
    ];
    const result = densify(path, 1000);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanceAlongM).toBeGreaterThanOrEqual(result[i - 1].distanceAlongM);
    }
  });

  it("total distanceAlongM approximates sum of segment distances", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0.01, lng: 0 },
      { lat: 0.01, lng: 0.01 },
    ];
    const seg1 = haversineM({ lat: 0, lng: 0 }, { lat: 0.01, lng: 0 });
    const seg2 = haversineM({ lat: 0.01, lng: 0 }, { lat: 0.01, lng: 0.01 });
    const expectedTotal = seg1 + seg2;
    const result = densify(path, 60);
    const total = result[result.length - 1].distanceAlongM;
    expect(total).toBeCloseTo(expectedTotal, -1);
  });

  it("collapses duplicate consecutive points", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0 },
    ];
    const result = densify(path, 60);
    // Should not have a zero-length segment; the intermediate duplicate is collapsed
    const uniqueLatLngs = result.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`);
    // The (0,0) duplicate should not produce extra output points
    const zeroCount = uniqueLatLngs.filter((s) => s === "0.000000,0.000000").length;
    expect(zeroCount).toBe(1);
  });

  it("handles three-point path with dense spacing", () => {
    const path: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.005 }, // ~556 m
      { lat: 0.005, lng: 0.005 },
    ];
    const result = densify(path, 100);
    // Every gap should be ≤ 100 m
    for (let i = 1; i < result.length; i++) {
      const gap = haversineM(result[i - 1], result[i]);
      expect(gap).toBeLessThanOrEqual(110);
    }
  });
});
