/**
 * A serial rate limiter that guarantees at least `minIntervalMs` between the
 * start of consecutive tasks. Tasks run one at a time in submission order, so
 * results stay ordered and outbound provider calls never trip the ≤1 req/s
 * public quota (T1.3).
 *
 * Spacing is measured from `Date.now()` rather than a fixed interval, so it
 * self-corrects if a task runs longer than the interval. Deterministic under
 * Vitest fake timers when driven with `vi.advanceTimersByTimeAsync`.
 */
export type Schedule = <T>(task: () => Promise<T>) => Promise<T>;

export function createRateLimiter(minIntervalMs: number): Schedule {
  let chain: Promise<unknown> = Promise.resolve();
  let last = Number.NEGATIVE_INFINITY;

  return function schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = chain.then(async () => {
      const wait = Math.max(0, last + minIntervalMs - Date.now());
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      last = Date.now();
      return task();
    });
    // Keep the chain alive even if a task rejects, so later tasks still run.
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
