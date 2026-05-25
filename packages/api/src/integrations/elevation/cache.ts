import type { ElevationCacheRepo, ElevationCacheRow } from "../../data/elevation-cache.repo";
import { batchedLookup } from "./batched-lookup";
import { QUANTISE_GRID_DEG } from "./constants";
import { cacheKey, quantise } from "./quantise";
import {
  type ElevationPoint,
  type ElevationProvider,
  ElevationProviderError,
  ElevationUnavailableError,
  type LatLng,
} from "./types";

export interface CacheStats {
  /** Unique quantised keys served from cache. */
  hits: number;
  /** Unique quantised keys that had to be fetched from a provider. */
  misses: number;
}

export interface GetElevationsResult {
  /** Elevations aligned 1:1 with the input points, in input order. */
  points: ElevationPoint[];
  stats: CacheStats;
}

export interface ElevationServiceConfig {
  repo: ElevationCacheRepo;
  /** Primary provider used for cache misses. */
  provider: ElevationProvider;
  /**
   * Logical dataset namespace baked into cache keys (the configured primary
   * dataset, e.g. "srtm30m"). Stable regardless of which provider answers.
   */
  datasetNamespace: string;
  /**
   * Secondary provider tried when the primary errors/exhausts (T1.6). Omit to
   * disable fallback.
   */
  fallbackProvider?: ElevationProvider;
  /** Toggle fallback even when a `fallbackProvider` is supplied. Default true. */
  fallbackEnabled?: boolean;
  /** Request id for correlating provider-switch logs. */
  requestId?: string;
  /** Log sink for provider switches; defaults to `console.warn`. */
  logger?: (message: string) => void;
  /** Quantisation grid in degrees. Defaults to {@link QUANTISE_GRID_DEG}. */
  gridDeg?: number;
  /** Overrides for the batched/rate-limited miss fetch (tests shrink these). */
  batchSize?: number;
  minIntervalMs?: number;
}

/**
 * Cache-first elevation reader — the single choke-point every elevation lookup
 * flows through (PROJECT-SPEC §3/§9). Quantise → read cache → fetch only the
 * misses (batched + rate-limited) → write-through → merge back to input order.
 * A repeated lookup serves entirely from cache (zero provider calls), which is
 * exactly what the cold-vs-warm benchmark (T3.5) measures.
 */
export function createElevationService(config: ElevationServiceConfig) {
  const gridDeg = config.gridDeg ?? QUANTISE_GRID_DEG;

  function log(message: string) {
    const prefix = config.requestId ? `[elevation ${config.requestId}] ` : "[elevation] ";
    (config.logger ?? console.warn)(`${prefix}${message}`);
  }

  /**
   * Fetch cache misses from the primary provider, falling back to the secondary
   * on a provider error. A provider error from the last-resort provider
   * propagates for the caller to degrade gracefully.
   */
  async function fetchMisses(coords: LatLng[]): Promise<ElevationPoint[]> {
    const opts = { batchSize: config.batchSize, minIntervalMs: config.minIntervalMs };
    try {
      return await batchedLookup(config.provider, coords, opts);
    } catch (primaryErr) {
      const canFallback = config.fallbackEnabled !== false && config.fallbackProvider !== undefined;
      if (!(primaryErr instanceof ElevationProviderError) || !canFallback) throw primaryErr;
      log(
        `primary provider "${primaryErr.provider}" failed (${primaryErr.message}); trying fallback`,
      );
      return await batchedLookup(config.fallbackProvider as ElevationProvider, coords, opts);
    }
  }

  async function getElevations(points: LatLng[]): Promise<GetElevationsResult> {
    if (points.length === 0) return { points: [], stats: { hits: 0, misses: 0 } };

    // 1. Quantise every input point to its cache key.
    const perInput = points.map((point) => {
      const q = quantise(point, gridDeg);
      return { key: cacheKey(config.datasetNamespace, q), q };
    });

    // Dedupe keys within the request; keep one representative grid-node coord.
    const keyToCoord = new Map<string, LatLng>();
    for (const { key, q } of perInput) {
      if (!keyToCoord.has(key)) keyToCoord.set(key, q);
    }
    const uniqueKeys = [...keyToCoord.keys()];

    // 2. Read the cache.
    const cached = await config.repo.findByKeys(uniqueKeys);

    // 3. Miss set = keys not PRESENT in the cache. Presence, not truthiness — a
    //    cached null (out-of-bounds) or 0 is a legitimate hit, never a re-fetch.
    const missKeys = uniqueKeys.filter((key) => !cached.has(key));

    // 4. Fetch misses (batched + rate-limited) and write them through.
    const fetchedByKey = new Map<string, ElevationPoint>();
    if (missKeys.length > 0) {
      const missCoords = missKeys.map((key) => keyToCoord.get(key) as LatLng);
      let fetched: ElevationPoint[];
      try {
        fetched = await fetchMisses(missCoords);
      } catch (err) {
        if (!(err instanceof ElevationProviderError)) throw err;
        // Graceful degradation: no provider could resolve the misses. Return the
        // points we DID resolve from cache and flag the unresolved remainder.
        const resolved = perInput
          .map(({ key }, i) => {
            const hit = cached.get(key);
            return hit
              ? {
                  lat: points[i].lat,
                  lng: points[i].lng,
                  elevationM: hit.elevationM,
                  dataset: hit.source,
                }
              : null;
          })
          .filter((p): p is ElevationPoint => p !== null);
        log(`all providers failed; degrading to ${resolved.length} cached point(s)`);
        throw new ElevationUnavailableError({
          resolved,
          unresolvedCount: missKeys.length,
          cause: err,
        });
      }

      const rows: ElevationCacheRow[] = fetched.map((point, i) => {
        const key = missKeys[i];
        fetchedByKey.set(key, point);
        return {
          key,
          lat: point.lat,
          lng: point.lng,
          elevationM: point.elevationM,
          dataset: config.datasetNamespace,
          source: point.dataset, // the provider's reported dataset = provenance
        };
      });
      await config.repo.upsertMany(rows);
    }

    // 5. Merge back to original input order, carrying provenance in `dataset`.
    const out: ElevationPoint[] = perInput.map(({ key }, i) => {
      const hit = cached.get(key);
      if (hit) {
        return {
          lat: points[i].lat,
          lng: points[i].lng,
          elevationM: hit.elevationM,
          dataset: hit.source,
        };
      }
      const miss = fetchedByKey.get(key) as ElevationPoint;
      return {
        lat: points[i].lat,
        lng: points[i].lng,
        elevationM: miss.elevationM,
        dataset: miss.dataset,
      };
    });

    return {
      points: out,
      stats: { hits: uniqueKeys.length - missKeys.length, misses: missKeys.length },
    };
  }

  return { getElevations };
}
