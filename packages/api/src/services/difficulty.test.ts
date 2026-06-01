import { describe, expect, it } from "vitest";
import { difficulty } from "./difficulty";

describe("difficulty", () => {
  it("returns Easiest for a trivial walk", () => {
    const result = difficulty(0, 1000); // 1 km, no climb
    expect(result.score).toBe(0);
    expect(result.band).toBe("Easiest");
  });

  it("returns Easiest for score < 50", () => {
    // 5 km (3.1 mi), 50 m (164 ft) → score = sqrt(2 * 164 * 3.1) ≈ sqrt(1017) ≈ 31.9
    const result = difficulty(50, 5000);
    expect(result.score).toBeLessThan(50);
    expect(result.band).toBe("Easiest");
  });

  it("returns Moderate for score 50–100", () => {
    // 5 km (3.1 mi), 200 m (656 ft) → score = sqrt(2 * 656 * 3.1) ≈ sqrt(4067) ≈ 63.8
    const result = difficulty(200, 5000);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(100);
    expect(result.band).toBe("Moderate");
  });

  it("returns Moderately Strenuous for score 100–150", () => {
    // 8 km (5 mi), 400 m (1312 ft) → score = sqrt(2 * 1312 * 5) ≈ sqrt(13120) ≈ 114.5
    const result = difficulty(400, 8000);
    expect(result.score).toBeGreaterThanOrEqual(100);
    expect(result.score).toBeLessThan(150);
    expect(result.band).toBe("Moderately Strenuous");
  });

  it("returns Strenuous for score 150–200", () => {
    // 10 km (6.2 mi), 600 m (1968 ft) → score = sqrt(2 * 1968 * 6.2) ≈ sqrt(24403) ≈ 156.2
    const result = difficulty(600, 10000);
    expect(result.score).toBeGreaterThanOrEqual(150);
    expect(result.score).toBeLessThan(200);
    expect(result.band).toBe("Strenuous");
  });

  it("returns Very Strenuous for score > 200", () => {
    // 15 km (9.3 mi), 1200 m (3937 ft) → score = sqrt(2 * 3937 * 9.3) ≈ sqrt(73228) ≈ 270.6
    const result = difficulty(1200, 15000);
    expect(result.score).toBeGreaterThan(200);
    expect(result.band).toBe("Very Strenuous");
  });

  it("reproduces a known NPS example", () => {
    // Old Rag: ~9.3 mi, ~2510 ft gain
    // score = sqrt(2 * 2510 * 9.3) ≈ sqrt(46686) ≈ 216 → Very Strenuous
    const gainFt = 2510;
    const miles = 9.3;
    const score = Math.sqrt(2 * gainFt * miles);
    // ~216 → Very Strenuous
    expect(score).toBeGreaterThan(200);

    // Using our function with metric inputs
    const ascentM = gainFt / 3.28084; // ~765 m
    const distanceM = miles * 1609.344; // ~14967 m
    const result = difficulty(ascentM, distanceM);
    expect(result.band).toBe("Very Strenuous");
    expect(result.score).toBeCloseTo(score, -1);
  });

  it("boundary values map to correct bands", () => {
    expect(difficulty(0, 0).band).toBe("Easiest");
    // Score just below 50 → Easiest
    // Score just above 200 → Very Strenuous
    expect(difficulty(1200, 15000).band).toBe("Very Strenuous");
  });
});
