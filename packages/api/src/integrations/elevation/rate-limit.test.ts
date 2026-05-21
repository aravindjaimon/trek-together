import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("spaces consecutive tasks by at least minIntervalMs", async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(1000);
    const startedAt: number[] = [];
    const task = () => {
      startedAt.push(Date.now());
      return Promise.resolve();
    };

    const all = Promise.all([schedule(task), schedule(task), schedule(task)]);
    await vi.advanceTimersByTimeAsync(3000);
    await all;

    expect(startedAt).toHaveLength(3);
    expect(startedAt[1] - startedAt[0]).toBe(1000);
    expect(startedAt[2] - startedAt[1]).toBe(1000);
  });

  it("runs the first task immediately (no initial wait)", async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(1000);
    const ran = vi.fn();

    const p = schedule(async () => ran());
    await vi.advanceTimersByTimeAsync(0);
    await p;

    expect(ran).toHaveBeenCalledTimes(1);
  });

  it("preserves submission order in the results", async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(10);
    const results = Promise.all([
      schedule(async () => "a"),
      schedule(async () => "b"),
      schedule(async () => "c"),
    ]);
    await vi.advanceTimersByTimeAsync(100);
    expect(await results).toEqual(["a", "b", "c"]);
  });

  it("keeps running later tasks after one rejects", async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(10);
    const failed = schedule(async () => {
      throw new Error("boom");
    });
    const after = schedule(async () => "ok");

    await vi.advanceTimersByTimeAsync(100);
    await expect(failed).rejects.toThrow("boom");
    expect(await after).toBe("ok");
  });
});
