import { describe, expect, it } from "vitest";
import { cacheKey, quantise, quantiseCoord } from "./quantise";

const GRID = 1 / 3600; // 1 arc-second

describe("quantiseCoord", () => {
  it("rounds to the nearest grid node", () => {
    expect(quantiseCoord(0, GRID)).toBe(0);
    // 10 + a fraction under half a grid step rounds back to the 10-node.
    expect(quantiseCoord(10 + GRID * 0.4, GRID)).toBeCloseTo(10, 10);
    // just over half a step rounds up to the next node.
    expect(quantiseCoord(10 + GRID * 0.6, GRID)).toBeCloseTo(10 + GRID, 10);
  });
});

describe("quantise", () => {
  it("collapses points within one grid cell to the same node", () => {
    const a = quantise({ lat: 10.0, lng: 20.0 }, GRID);
    const b = quantise({ lat: 10.0001, lng: 20.0001 }, GRID); // < half a grid step away
    expect(cacheKey("srtm30m", a)).toBe(cacheKey("srtm30m", b));
  });

  it("keeps points in different cells distinct", () => {
    const a = quantise({ lat: 10.0, lng: 20.0 }, GRID);
    const b = quantise({ lat: 10.01, lng: 20.0 }, GRID);
    expect(cacheKey("srtm30m", a)).not.toBe(cacheKey("srtm30m", b));
  });
});

describe("cacheKey", () => {
  it("namespaces the key by dataset", () => {
    const q = quantise({ lat: 1, lng: 2 }, GRID);
    expect(cacheKey("srtm30m", q)).toMatch(/^srtm30m:/);
    expect(cacheKey("srtm30m", q)).not.toBe(cacheKey("srtm90m", q));
  });

  it("is stable and free of float-representation noise", () => {
    const p = { lat: 27.9881, lng: 86.925 };
    expect(cacheKey("srtm30m", quantise(p, GRID))).toBe(cacheKey("srtm30m", quantise(p, GRID)));
  });
});
