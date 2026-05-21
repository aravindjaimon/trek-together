import { describe, expect, it } from "vitest";
import { chunk } from "./batch";

describe("chunk", () => {
  it("splits into consecutive chunks of at most `size`", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when input fits", () => {
    expect(chunk([1, 2, 3], 100)).toEqual([[1, 2, 3]]);
  });

  it("splits 101 items into 2 chunks at the 100 boundary", () => {
    const items = Array.from({ length: 101 }, (_, i) => i);
    const chunks = chunk(items, 100);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(1);
  });

  it("returns an empty array for empty input", () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it("throws on a size below 1", () => {
    expect(() => chunk([1], 0)).toThrow(/size must be >= 1/);
  });
});
