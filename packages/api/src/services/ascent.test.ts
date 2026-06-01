import { describe, expect, it } from "vitest";
import { cumulativeGainLoss } from "./ascent";
import type { ProfilePoint } from "./elevation-profile";

function profile(heights: number[], spacingM = 100): ProfilePoint[] {
  return heights.map((elevationM, i) => ({
    distanceAlongM: i * spacingM,
    elevationM,
    lat: i * 0.001,
    lng: 0,
  }));
}

describe("cumulativeGainLoss", () => {
  it("zeros for a single point", () => {
    expect(cumulativeGainLoss(profile([100]))).toEqual({
      ascentM: 0,
      descentM: 0,
    });
  });

  it("zeros for a flat profile", () => {
    expect(cumulativeGainLoss(profile([100, 100, 100]))).toEqual({
      ascentM: 0,
      descentM: 0,
    });
  });

  it("computes pure ascent", () => {
    // 100 → 200 → 300 (gain of 200)
    expect(cumulativeGainLoss(profile([100, 200, 300]))).toEqual({
      ascentM: 200,
      descentM: 0,
    });
  });

  it("computes pure descent", () => {
    // 300 → 200 → 100 (loss of 200)
    expect(cumulativeGainLoss(profile([300, 200, 100]))).toEqual({
      ascentM: 0,
      descentM: 200,
    });
  });

  it("computes up-then-down", () => {
    // 100 → 150 (gain 50) → 120 (loss 30)
    expect(cumulativeGainLoss(profile([100, 150, 120]))).toEqual({
      ascentM: 50,
      descentM: 30,
    });
  });

  it("computes down-then-up", () => {
    // 200 → 150 (loss 50) → 180 (gain 30)
    expect(cumulativeGainLoss(profile([200, 150, 180]))).toEqual({
      ascentM: 30,
      descentM: 50,
    });
  });

  it("computes rolling terrain", () => {
    const p = profile([100, 120, 115, 140, 130, 160, 150]);
    // gains: 20+25+30 = 75, losses: 5+10+10 = 25
    expect(cumulativeGainLoss(p)).toEqual({
      ascentM: 75,
      descentM: 25,
    });
  });
});
