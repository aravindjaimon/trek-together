import { chunk } from "./batch";
import { BATCH_SIZE, MIN_REQUEST_INTERVAL_MS } from "./constants";
import { createRateLimiter } from "./rate-limit";
import type { ElevationPoint, ElevationProvider, LatLng } from "./types";

export interface BatchedLookupOptions {
  /** Max points per outbound request. Defaults to {@link BATCH_SIZE} (100). */
  batchSize?: number;
  /** Minimum spacing between requests, ms. Defaults to {@link MIN_REQUEST_INTERVAL_MS}. */
  minIntervalMs?: number;
}

/**
 * Look up elevations for arbitrarily many points through a single provider,
 * splitting into ≤`batchSize` requests and spacing them ≥`minIntervalMs` apart
 * (T1.3). Results are merged back in the original input order. Any provider
 * error propagates (as the provider's typed `ElevationProviderError`).
 */
export async function batchedLookup(
  provider: ElevationProvider,
  points: LatLng[],
  options: BatchedLookupOptions = {},
): Promise<ElevationPoint[]> {
  if (points.length === 0) return [];

  const batchSize = options.batchSize ?? BATCH_SIZE;
  const minIntervalMs = options.minIntervalMs ?? MIN_REQUEST_INTERVAL_MS;

  const schedule = createRateLimiter(minIntervalMs);
  const batches = chunk(points, batchSize);

  const results = await Promise.all(batches.map((batch) => schedule(() => provider.lookup(batch))));

  return results.flat();
}
