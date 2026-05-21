/**
 * Tunable constants for the elevation integration layer. Defaults match the
 * OpenTopoData public-host limits and the `srtm30m` dataset; callers can shrink
 * them (e.g. in unit tests) via config where these are consumed.
 */

/** Max locations per outbound provider request (OpenTopoData allows 100). */
export const BATCH_SIZE = 100;

/** Minimum spacing between outbound provider requests — ≤1 req/s public limit. */
export const MIN_REQUEST_INTERVAL_MS = 1000;

/**
 * Cache-key quantisation grid, in degrees. 1 arc-second (1/3600° ≈ 30 m at the
 * equator) matches the `srtm30m` dataset resolution, so densified sample points
 * within one SRTM cell collapse to a single cache key. Decision recorded for
 * the T9.4 report.
 */
export const QUANTISE_GRID_DEG = 1 / 3600;

/**
 * Elevation-cache TTL, in seconds (30 days). SRTM is near-static, so a long TTL
 * maximises cache hits while letting dataset revisions / quota resets self-heal.
 * Consumed by the Mongo TTL index (packages/db/src/setup-indexes.ts). Decision
 * recorded for the T9.4 report.
 */
export const CACHE_TTL_S = 30 * 24 * 60 * 60;
