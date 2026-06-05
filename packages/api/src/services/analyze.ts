import type { CacheStats } from "../integrations/elevation/cache";
import type { LatLng } from "../integrations/elevation/types";
import type { AnalyzeOutput } from "../routers/routes/analyze.schema";
import { cumulativeGainLoss } from "./ascent";
import { difficulty } from "./difficulty";
import { buildProfile, type ElevationClient } from "./elevation-profile";
import { haversineM } from "./geo";
import { smoothProfile } from "./smoothing";
import { naismithSeconds, toblerSeconds } from "./time";

const DEFAULT_SPACING_M = 60;

// ponytail: hard ceiling on densified points so one request can't exhaust the
// provider quota (100 pts/batch, ~1000/day). Raise if long routes need it.
const MAX_PROFILE_POINTS = 5000;

export interface AnalyzeOptions {
  spacingM?: number;
}

/**
 * Raised when a route would densify to more points than {@link MAX_PROFILE_POINTS}.
 * The procedure maps this to a typed `VALIDATION` error (T3.4).
 */
export class RouteTooLargeError extends Error {
  readonly estimatedPoints: number;
  constructor(estimatedPoints: number) {
    super(
      `Route is too large: ~${estimatedPoints} sample points exceeds the ${MAX_PROFILE_POINTS} limit`,
    );
    this.name = "RouteTooLargeError";
    this.estimatedPoints = estimatedPoints;
  }
}

/**
 * Compose the M2 math + M1 cache into the flagship analysis (T3.2). Framework-free
 * and DB-agnostic: elevation comes exclusively through the injected `elevationClient`
 * (the cache wrapper, T1.5), so this is unit-testable with a fake client.
 *
 * Pipeline (order pinned by services/pipeline.test.ts):
 *   buildProfile → smoothProfile → cumulativeGainLoss → naismith + tobler → difficulty
 */
export async function analyzeRoute(
  path: LatLng[],
  elevationClient: ElevationClient,
  opts: AnalyzeOptions = {},
): Promise<AnalyzeOutput> {
  const spacingM = opts.spacingM ?? DEFAULT_SPACING_M;

  guardSize(path, spacingM);

  // Spy wrapper: capture cache stats without touching the already-tested
  // buildProfile (which discards them). Stats feed the benchmark (T3.5) + meta.
  let stats: CacheStats = { hits: 0, misses: 0 };
  const withStats: ElevationClient = {
    async getElevations(points) {
      const result = await elevationClient.getElevations(points);
      stats = result.stats;
      return result;
    },
  };

  const { profile, totalDistanceM } = await buildProfile(path, withStats, spacingM);
  const smoothed = smoothProfile(profile);
  const { ascentM, descentM } = cumulativeGainLoss(smoothed);
  const { score, band } = difficulty(ascentM, totalDistanceM);

  return {
    elevationProfile: smoothed.map((p) => ({
      distanceAlongM: p.distanceAlongM,
      elevationM: p.elevationM,
    })),
    distanceM: totalDistanceM,
    ascentM,
    descentM,
    estTimeNaismithS: naismithSeconds(totalDistanceM, ascentM),
    estTimeToblerS: toblerSeconds(smoothed),
    difficultyScore: score,
    difficultyBand: band,
    meta: { cacheHits: stats.hits, cacheMisses: stats.misses },
  };
}

/** Cheap length-based upper bound on densified points — no network, no double densify. */
function guardSize(path: LatLng[], spacingM: number): void {
  let lengthM = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (!prev || !curr) continue; // unreachable: i ∈ [1, length)
    lengthM += haversineM(prev, curr);
  }
  const estimatedPoints = Math.ceil(lengthM / spacingM) + path.length;
  if (estimatedPoints > MAX_PROFILE_POINTS) {
    throw new RouteTooLargeError(estimatedPoints);
  }
}
