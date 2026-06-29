import type { GetElevationsResult } from "../integrations/elevation/cache";
import type { LatLng } from "../integrations/elevation/types";
import { densify } from "./geo";

export interface ProfilePoint {
  distanceAlongM: number;
  elevationM: number;
  lat: number;
  lng: number;
}

export interface BuildProfileResult {
  profile: ProfilePoint[];
  totalDistanceM: number;
}

export interface ElevationClient {
  getElevations(points: LatLng[]): Promise<GetElevationsResult>;
}

/** Max fraction of samples allowed to fall outside dataset coverage (T10.7). */
const MAX_COVERAGE_GAP_FRACTION = 0.2;

/**
 * Raised when too much of a route has no elevation data (drawn across water or
 * outside the dataset's ~60°N–56°S coverage). A user-input problem — mapped to
 * VALIDATION at the procedure boundary, unlike transient provider failures.
 */
export class ElevationCoverageError extends Error {
  readonly unresolvedCount: number;

  constructor(unresolvedCount: number, totalSamples: number) {
    super(
      `Elevation coverage too sparse: ${unresolvedCount} of ${totalSamples} sample points have no data`,
    );
    this.name = "ElevationCoverageError";
    this.unresolvedCount = unresolvedCount;
  }
}

/**
 * Turn a raw polyline into a validated elevation profile:
 * densify → cache-first elevation lookup → zip with cumulative distance.
 *
 * Elevation comes exclusively through the provided `elevationClient`, which
 * wraps the cache (T1.5). No direct provider calls.
 */
export async function buildProfile(
  path: LatLng[],
  elevationClient: ElevationClient,
  densifySpacingM = 60,
): Promise<BuildProfileResult> {
  const densified = densify(path, densifySpacingM);
  if (densified.length === 0) {
    return { profile: [], totalDistanceM: 0 };
  }

  const latLngs: LatLng[] = densified.map((p) => ({ lat: p.lat, lng: p.lng }));
  const { points } = await elevationClient.getElevations(latLngs);

  if (points.length !== densified.length) {
    throw new Error(
      `Elevation result length mismatch: expected ${densified.length}, got ${points.length}`,
    );
  }

  const profile: ProfilePoint[] = [];
  let skipped = 0;
  for (let i = 0; i < densified.length; i++) {
    const d = densified[i];
    const e = points[i];
    if (!d || !e) continue; // unreachable: lengths verified equal above

    if (e.elevationM === null) {
      // Drop the gap: for gain/loss and Tobler this equals linear interpolation
      // (an interpolated point lies on the chord between surviving neighbours),
      // so a few SRTM void cells on a coastal trail don't kill the analysis.
      skipped += 1;
      continue;
    }
    if (Number.isNaN(e.elevationM)) {
      throw new Error(`Elevation is NaN at (${d.lat}, ${d.lng})`);
    }

    profile.push({
      distanceAlongM: d.distanceAlongM,
      elevationM: e.elevationM,
      lat: d.lat,
      lng: d.lng,
    });
  }

  // Isolated voids are tolerable; a route that is mostly outside coverage
  // (drawn across water) is a user-input problem and fails typed (T10.7).
  if (
    skipped > 0 &&
    (profile.length < 2 || skipped > densified.length * MAX_COVERAGE_GAP_FRACTION)
  ) {
    throw new ElevationCoverageError(skipped, densified.length);
  }

  validateProfile(profile);

  const last = densified[densified.length - 1];
  return {
    profile,
    totalDistanceM: last ? last.distanceAlongM : 0,
  };
}

function validateProfile(profile: ProfilePoint[]): void {
  for (let i = 1; i < profile.length; i++) {
    const curr = profile[i];
    const prev = profile[i - 1];
    if (!curr || !prev) continue; // unreachable: i ∈ [1, length)
    if (curr.distanceAlongM < prev.distanceAlongM) {
      throw new Error(
        `distanceAlongM is not monotonically non-decreasing at index ${i}: ` +
          `${prev.distanceAlongM} → ${curr.distanceAlongM}`,
      );
    }
  }
}
