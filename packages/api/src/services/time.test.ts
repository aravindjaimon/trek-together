import { describe, expect, it } from "vitest";
import type { ProfilePoint } from "./elevation-profile";
import { naismithSeconds, toblerSeconds } from "./time";

function profile(heights: number[], spacingM = 100): ProfilePoint[] {
  return heights.map((elevationM, i) => ({
    distanceAlongM: i * spacingM,
    elevationM,
    lat: i * 0.001,
    lng: 0,
  }));
}

describe("naismithSeconds", () => {
  it("returns ~7200 s for 10 km flat (2 hours)", () => {
    const result = naismithSeconds(10_000, 0);
    expect(result).toBeCloseTo(7200, -1);
  });

  it("adds 1 hour per 600 m ascent", () => {
    const flat = naismithSeconds(0, 0);
    const withClimb = naismithSeconds(0, 600);
    expect(withClimb - flat).toBeCloseTo(3600, -1);
  });

  it("combines distance and ascent", () => {
    const result = naismithSeconds(5000, 300);
    expect(result).toBeCloseTo(5400, -1);
  });

  it("returns 0 for zero distance and zero ascent", () => {
    expect(naismithSeconds(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    const result = naismithSeconds(42_195, 8848);
    expect(result).toBeGreaterThan(80000);
    expect(result).toBeLessThan(90000);
  });
});

describe("toblerSeconds", () => {
  it("returns 0 for empty or single-point profile", () => {
    expect(toblerSeconds([])).toBe(0);
    expect(toblerSeconds(profile([100]))).toBe(0);
  });

  it("on flat terrain approximates Naismith flat speed (~5 km/h)", () => {
    // 10 km at 0% grade → W = 6 * exp(-3.5 * 0.05) ≈ 6 * 0.839 ≈ 5.04 km/h
    // time ≈ 10 km / 5.04 km/h ≈ 1.985 h ≈ 7147 s
    const p = profile(Array(101).fill(100)); // 100 segments × 100 m = 10 km
    const result = toblerSeconds(p);
    // Should be close to 10 km / 5 km/h = 7200 s
    expect(result).toBeGreaterThan(6800);
    expect(result).toBeLessThan(7600);
  });

  it("slower on uphill than flat", () => {
    // 1 km with 10% uphill grade
    // dh=100 per segment, de=+10 per segment, S=0.1
    // W = 6 * exp(-3.5 * 0.15) ≈ 6 * 0.592 ≈ 3.55 km/h
    const heights: number[] = [];
    for (let i = 0; i <= 10; i++) heights.push(i * 10);
    const p = profile(heights); // 1000 m, +100 m
    const uphill = toblerSeconds(p);

    // Flat equivalent (same distance, 0 grade)
    const flat = profile(Array(11).fill(0));
    const flatTime = toblerSeconds(flat);

    expect(uphill).toBeGreaterThan(flatTime);
  });

  it("faster on gentle downhill than flat", () => {
    // 1 km with -5% downhill grade (optimal)
    // S = -0.05, W = 6 * exp(-3.5 * 0) = 6 km/h
    const heights: number[] = [];
    for (let i = 0; i <= 10; i++) heights.push(-i * 5);
    const p = profile(heights);
    const downhill = toblerSeconds(p);

    const flat = profile(Array(11).fill(0));
    const flatTime = toblerSeconds(flat);

    expect(downhill).toBeLessThan(flatTime);
  });

  it("handles zero-horizontal segments gracefully", () => {
    // Two points at same distance → near-vertical guard
    const p: ProfilePoint[] = [
      { distanceAlongM: 0, elevationM: 100, lat: 0, lng: 0 },
      { distanceAlongM: 0, elevationM: 110, lat: 0, lng: 0 },
    ];
    const result = toblerSeconds(p);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it("Naismith and Tobler are close on flat terrain", () => {
    const distanceM = 10000;
    const ascentM = 0;
    const n = naismithSeconds(distanceM, ascentM);
    const t = toblerSeconds(profile(Array(101).fill(0)));
    // Within 10% on flat terrain
    const ratio = Math.abs(t - n) / n;
    expect(ratio).toBeLessThan(0.1);
  });
});
