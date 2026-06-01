import { describe, expect, it } from "vitest";
import { climbRoute, flatRoute, rollingRoute, singlePoint, zeroLength } from "./__fixtures__";
import { cumulativeGainLoss } from "./ascent";
import { difficulty } from "./difficulty";
import { smoothProfile } from "./smoothing";
import { naismithSeconds, toblerSeconds } from "./time";

function pipeline(fixture: typeof flatRoute) {
  const smoothed = smoothProfile(fixture);
  const { ascentM, descentM } = cumulativeGainLoss(smoothed);
  const totalDistanceM = fixture.length > 0 ? fixture[fixture.length - 1].distanceAlongM : 0;
  const naismith = naismithSeconds(totalDistanceM, ascentM);
  const tobler = toblerSeconds(smoothed);
  const { score, band } = difficulty(ascentM, totalDistanceM);
  return { ascentM, descentM, totalDistanceM, naismith, tobler, score, band };
}

describe("Golden fixtures — full pipeline", () => {
  describe("flat route (5 km, 100 m)", () => {
    const result = pipeline(flatRoute);

    it("detects zero ascent/descent", () => {
      expect(result.ascentM).toBe(0);
      expect(result.descentM).toBe(0);
    });

    it("reports correct total distance", () => {
      expect(result.totalDistanceM).toBeCloseTo(5000, -1);
    });

    it("Naismith ≈ 1 hour", () => {
      expect(result.naismith).toBeCloseTo(3600, -1);
    });

    it("Tobler ≈ Naismith on flat terrain", () => {
      const ratio = Math.abs(result.tobler - result.naismith) / result.naismith;
      expect(ratio).toBeLessThan(0.15);
    });

    it("scores Easiest", () => {
      expect(result.score).toBe(0);
      expect(result.band).toBe("Easiest");
    });
  });

  describe("climb route (3 km, +300 m)", () => {
    const result = pipeline(climbRoute);

    it("detects correct ascent (smoothed: ~280 m due to MA edge effects)", () => {
      // Raw: 300 m. 5-pt MA rounds off edges → ~280 m. Still correct for a smoothed profile.
      expect(result.ascentM).toBeGreaterThan(270);
      expect(result.ascentM).toBeLessThan(290);
    });

    it("detects zero descent", () => {
      expect(result.descentM).toBe(0);
    });

    it("reports correct total distance", () => {
      expect(result.totalDistanceM).toBeCloseTo(3000, -1);
    });

    it("Naismith proportional to smoothed ascent", () => {
      // With 280 m smoothed ascent: (3000/5000)*3600 + (280/600)*3600 = 2160 + 1680 = 3840
      expect(result.naismith).toBeCloseTo(3840, -1);
    });

    it("Tobler is slower than flat pace on uphill", () => {
      const toblerHours = result.tobler / 3600;
      // 3 km at 5 km/h flat = 0.6 h. Uphill should be slower => > 0.6 h
      expect(toblerHours).toBeGreaterThan(0.6);
    });

    it("scores Moderate", () => {
      expect(result.band).toBe("Moderate");
      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThan(100);
    });
  });

  describe("rolling route (4 km, +200 m, -50 m)", () => {
    const result = pipeline(rollingRoute);

    it("detects correct ascent/descent", () => {
      // With smoothing, ascent should be close to 200
      expect(result.ascentM).toBeGreaterThan(150);
      expect(result.ascentM).toBeLessThanOrEqual(200);
      expect(result.descentM).toBeGreaterThan(25);
      expect(result.descentM).toBeLessThanOrEqual(50);
    });

    it("reports correct total distance", () => {
      expect(result.totalDistanceM).toBeCloseTo(4000, -1);
    });

    it("Naismith proportional to smoothed ascent", () => {
      // Naismith = (distanceM/5000)*3600 + (ascentM/600)*3600
      // With smoothed ascent, should be around 3840–4080
      expect(result.naismith).toBeGreaterThan(3800);
      expect(result.naismith).toBeLessThan(4200);
    });

    it("scores Moderate", () => {
      expect(result.band).toBe("Moderate");
    });
  });

  describe("edge fixtures", () => {
    it("single point: zero ascent, Naismith 0, Easiest", () => {
      const r = pipeline(singlePoint);
      expect(r.ascentM).toBe(0);
      expect(r.descentM).toBe(0);
      expect(r.naismith).toBe(0);
      expect(r.band).toBe("Easiest");
    });

    it("zero-length: handled without throwing", () => {
      expect(() => pipeline(zeroLength)).not.toThrow();
      const r = pipeline(zeroLength);
      expect(r.ascentM).toBe(0);
      expect(r.naismith).toBe(0);
    });
  });
});
