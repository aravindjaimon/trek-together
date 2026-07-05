import { describe, expect, it } from "vitest";
import { mapStats } from "./logs.repo";

describe("mapStats — Extended-JSON stats decoding", () => {
  it("decodes wrapped $sum/$avg numbers to plain numbers", () => {
    const stats = mapStats({
      count: { $numberInt: "12" },
      avgRating: { $numberDouble: "4.25" },
      avgActualDurationS: { $numberDouble: "15000" },
    });
    expect(stats).toEqual({ count: 12, avgRating: 4.25, avgActualDurationS: 15000 });
  });

  it("passes through already-plain numbers (mocked repos)", () => {
    const stats = mapStats({ count: 3, avgRating: 5, avgActualDurationS: 3600 });
    expect(stats).toEqual({ count: 3, avgRating: 5, avgActualDurationS: 3600 });
  });

  it("returns null averages when there are no logs", () => {
    // An empty $group yields no row; but if count is 0 the averages are meaningless.
    expect(mapStats({ count: 0, avgRating: null, avgActualDurationS: null })).toEqual({
      count: 0,
      avgRating: null,
      avgActualDurationS: null,
    });
  });

  it("treats a missing count as zero", () => {
    expect(mapStats({})).toEqual({ count: 0, avgRating: null, avgActualDurationS: null });
  });
});
