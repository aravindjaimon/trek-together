import { chunk } from "./batch";
import { BATCH_SIZE, MIN_REQUEST_INTERVAL_MS } from "./constants";
import { createRateLimiter, type Schedule } from "./rate-limit";
import {
  type ElevationPoint,
  type ElevationProvider,
  ElevationProviderError,
  type LatLng,
} from "./types";

export interface BatchedLookupOptions {
  /** Max points per outbound request. Defaults to {@link BATCH_SIZE} (100). */
  batchSize?: number;
  /** Minimum spacing between requests, ms. Defaults to {@link MIN_REQUEST_INTERVAL_MS}. */
  minIntervalMs?: number;
}

/**
 * Process-global limiter registry, keyed by provider identity + interval: every
 * concurrent request shares ONE serial chain per provider, so the server as a
 * whole honours the public per-IP quota (≤1 req/s). A per-call limiter only
 * spaced batches within a single request — ten concurrent users made ten
 * parallel chains (T10.6). Tests that shrink `minIntervalMs` land on their own
 * key, keeping their timing deterministic.
 */
const limiters = new Map<string, Schedule>();

function limiterFor(providerName: string, minIntervalMs: number): Schedule {
  const key = `${providerName}:${minIntervalMs}`;
  let schedule = limiters.get(key);
  if (!schedule) {
    schedule = createRateLimiter(minIntervalMs);
    limiters.set(key, schedule);
  }
  return schedule;
}

/** Upstream statuses worth one retry — rate limit or transient gateway trouble. */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const DEFAULT_RETRY_DELAY_MS = 1500;
const MAX_RETRY_DELAY_MS = 10_000;

/**
 * Look up elevations for arbitrarily many points through a single provider,
 * splitting into ≤`batchSize` requests spaced ≥`minIntervalMs` apart on the
 * provider's shared chain (T1.3, T10.6). Batches run strictly in sequence, so
 * the first hard failure stops the run — no queued batches burn quota against
 * an already-failing host. A 429/502/503/504 gets exactly one retry, honouring
 * `Retry-After` up to {@link MAX_RETRY_DELAY_MS}. Results are merged back in
 * the original input order. Any provider error propagates (as the provider's
 * typed `ElevationProviderError`).
 */
export async function batchedLookup(
  provider: ElevationProvider,
  points: LatLng[],
  options: BatchedLookupOptions = {},
): Promise<ElevationPoint[]> {
  if (points.length === 0) return [];

  const batchSize = options.batchSize ?? BATCH_SIZE;
  const minIntervalMs = options.minIntervalMs ?? MIN_REQUEST_INTERVAL_MS;

  const schedule = limiterFor(provider.name, minIntervalMs);
  const batches = chunk(points, batchSize);

  const results: ElevationPoint[][] = [];
  for (const batch of batches) {
    try {
      results.push(await schedule(() => provider.lookup(batch)));
    } catch (err) {
      if (
        !(err instanceof ElevationProviderError) ||
        err.status === undefined ||
        !RETRYABLE_STATUSES.has(err.status)
      ) {
        throw err;
      }
      const delayMs = Math.min(
        err.retryAfterS !== undefined ? err.retryAfterS * 1000 : DEFAULT_RETRY_DELAY_MS,
        MAX_RETRY_DELAY_MS,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      results.push(await schedule(() => provider.lookup(batch)));
    }
  }

  return results.flat();
}
