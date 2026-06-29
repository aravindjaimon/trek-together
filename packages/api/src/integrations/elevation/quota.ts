import { ElevationProviderError } from "./types";

/**
 * Per-provider daily request budget (UTC day). OpenTopoData's public host
 * allows ~1000 calls/day per source IP; counting locally turns the 1001st
 * call into an immediate typed failure — which flows through the normal
 * fallback → ELEVATION_UNAVAILABLE degradation — instead of hammering an
 * already-exhausted host (T10.6).
 */
// ponytail: in-memory counter — per-process, resets on restart; move to Mongo
// if the server ever runs multi-instance.

interface Budget {
  utcDay: number;
  used: number;
}

const budgets = new Map<string, Budget>();

/**
 * Count one outbound request against `provider`'s budget, throwing a typed
 * `ElevationProviderError` once `limit` is reached for the current UTC day.
 */
export function consumeDailyBudget(provider: string, limit: number, now = Date.now()): void {
  const utcDay = Math.floor(now / 86_400_000);
  let budget = budgets.get(provider);
  if (!budget || budget.utcDay !== utcDay) {
    budget = { utcDay, used: 0 };
    budgets.set(provider, budget);
  }
  if (budget.used >= limit) {
    throw new ElevationProviderError(`Daily request budget (${limit}) exhausted`, { provider });
  }
  budget.used += 1;
}

/** Test seam — budgets are process-global state. */
export function resetDailyBudgets(): void {
  budgets.clear();
}
