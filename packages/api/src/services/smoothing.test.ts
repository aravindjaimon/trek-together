import { describe, expect, it } from "vitest";
import type { ProfilePoint } from "./elevation-profile";
import { smoothProfile } from "./smoothing";

function profile(heights: number[], spacingM = 100): ProfilePoint[] {
  return heights.map((elevationM, i) => ({
    distanceAlongM: i * spacingM,
    elevationM,
    lat: i * 0.001,
    lng: 0,
  }));
}

describe("smoothProfile", () => {
  it("returns empty for empty input", () => {
    expect(smoothProfile([])).toEqual([]);
  });

  it("preserves single point", () => {
    const p = profile([42]);
    const result = smoothProfile(p);
    expect(result).toHaveLength(1);
    expect(result[0].elevationM).toBe(42);
  });

  describe("moving average", () => {
    it("preserves a flat profile", () => {
      const p = profile([100, 100, 100, 100, 100]);
      // MA disabled, threshold disabled
      const result = smoothProfile(p, { windowSize: 1, minChangeThresholdM: 0 });
      expect(result.map((r) => r.elevationM)).toEqual([100, 100, 100, 100, 100]);
    });

    it("smooths a spike with 5-point MA", () => {
      const p = profile([100, 100, 100, 200, 100, 100, 100]);
      const result = smoothProfile(p, { windowSize: 5, minChangeThresholdM: 0 });
      // The spike at index 3 should be pulled down by neighbours
      expect(result[3].elevationM).toBeLessThan(200);
      expect(result[3].elevationM).toBeGreaterThan(100);
    });

    it("smooths noise while preserving trend", () => {
      // Gradual climb with noise
      const raw = [100, 102, 98, 105, 103, 150, 147, 155, 200, 198];
      const p = profile(raw);
      const result = smoothProfile(p, { windowSize: 3, minChangeThresholdM: 0 });
      // The general upward trend should survive; elevation range should shrink
      const resultRange =
        Math.max(...result.map((r) => r.elevationM)) - Math.min(...result.map((r) => r.elevationM));
      const rawRange = Math.max(...raw) - Math.min(...raw);
      expect(resultRange).toBeLessThan(rawRange);
    });
  });

  describe("minimum-change threshold", () => {
    it("clamps small elevation changes with MA disabled", () => {
      // Small 1-2 m noise on a flat 100 m baseline
      const p = profile([100, 101, 99, 102, 100, 98, 100]);
      // MA=1 (no MA), threshold=3
      const result = smoothProfile(p, { windowSize: 1, minChangeThresholdM: 3 });
      // All noise should be clamped: every point should read 100
      expect(result.map((r) => r.elevationM)).toEqual([100, 100, 100, 100, 100, 100, 100]);
    });

    it("preserves real climbs above the threshold", () => {
      // Flat, then real climb, then flat
      const p = profile([100, 100, 100, 150, 150, 150]);
      const result = smoothProfile(p, { windowSize: 1, minChangeThresholdM: 3 });
      // The climb of 50 m from index 2→3 exceeds the 3 m threshold
      expect(result[3].elevationM).toBe(150);
      // Flat segments stay flat
      expect(result[0].elevationM).toBe(100);
      expect(result[1].elevationM).toBe(100);
    });

    it("combined MA + threshold reduces noise effectively", () => {
      // Gradual climb from 100 to 200 with ±2 m noise over 11 points
      const raw: number[] = [];
      for (let i = 0; i < 11; i++) {
        const base = 100 + i * 10;
        const noise = i % 2 === 0 ? 2 : -2;
        raw.push(base + noise);
      }
      const p = profile(raw, 100);
      const result = smoothProfile(p, { windowSize: 5, minChangeThresholdM: 3 });
      // The output should be monotonically increasing (noise removed)
      for (let i = 1; i < result.length; i++) {
        expect(result[i].elevationM).toBeGreaterThanOrEqual(result[i - 1].elevationM);
      }
    });

    it("treats threshold=0 as off", () => {
      const p = profile([100, 101, 100]);
      const result = smoothProfile(p, { windowSize: 1, minChangeThresholdM: 0 });
      // No clamping; small 1 m changes preserved
      expect(result[1].elevationM).toBe(101);
    });
  });

  it("does not mutate input", () => {
    const p = profile([100, 120, 100]);
    const copy = profile([100, 120, 100]);
    smoothProfile(p, { windowSize: 3, minChangeThresholdM: 3 });
    expect(p).toEqual(copy);
  });

  it("preserves distanceAlongM, lat, lng", () => {
    const p = profile([100, 200, 150], 50);
    const result = smoothProfile(p, { windowSize: 3, minChangeThresholdM: 3 });
    for (let i = 0; i < result.length; i++) {
      expect(result[i].distanceAlongM).toBe(p[i].distanceAlongM);
      expect(result[i].lat).toBe(p[i].lat);
      expect(result[i].lng).toBe(p[i].lng);
    }
  });
});
