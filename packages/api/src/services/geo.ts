import type { LatLng } from "../integrations/elevation/types";

const EARTH_RADIUS_M = 6_371_000;

export interface DensifiedPoint extends LatLng {
  distanceAlongM: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two WGS84 coordinates in metres (Haversine).
 */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const cosA = Math.cos(toRadians(a.lat));
  const cosB = Math.cos(toRadians(b.lat));

  const aHav = sinDLat * sinDLat + cosA * cosB * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aHav), Math.sqrt(1 - aHav));
  return EARTH_RADIUS_M * c;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Resample a polyline so consecutive points are no farther than `spacingM`
 * apart. Original vertices are preserved in order. Each output point carries a
 * cumulative `distanceAlongM` from the start of the path.
 *
 * Degenerate handling:
 * - A single-point path → returned as-is with `distanceAlongM = 0`.
 * - Consecutive duplicate coordinates → collapsed to one point.
 * - Zero-length segments → skipped.
 */
export function densify(path: LatLng[], spacingM = 60): DensifiedPoint[] {
  if (path.length === 0) return [];
  if (path.length === 1) {
    return [{ ...path[0], distanceAlongM: 0 }];
  }

  const result: DensifiedPoint[] = [];
  let cumulative = 0;

  // Start vertex
  result.push({ ...path[0], distanceAlongM: 0 });

  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const segDist = haversineM(prev, curr);

    if (segDist < 1e-6) {
      // Duplicate / zero-length — collapse
      result[result.length - 1] = { ...curr, distanceAlongM: cumulative };
      continue;
    }

    const steps = Math.floor(segDist / spacingM);
    if (steps === 0) {
      cumulative += segDist;
      result.push({ ...curr, distanceAlongM: cumulative });
      continue;
    }

    // Interpolate intermediate points at `spacingM` intervals
    for (let s = 1; s <= steps; s++) {
      const t = (s * spacingM) / segDist;
      cumulative += spacingM;
      result.push({
        lat: lerp(prev.lat, curr.lat, t),
        lng: lerp(prev.lng, curr.lng, t),
        distanceAlongM: cumulative,
      });
    }

    // Append the final vertex if not already exact
    const remainder = segDist - steps * spacingM;
    if (remainder > 1e-6) {
      cumulative += remainder;
      result.push({ ...curr, distanceAlongM: cumulative });
    } else {
      // Adjust the last interpolated point to be exactly the vertex
      const last = result[result.length - 1];
      last.lat = curr.lat;
      last.lng = curr.lng;
    }
  }

  return result;
}
