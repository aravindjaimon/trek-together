import type { ProfilePoint } from "../elevation-profile";

/**
 * A completely flat 5 km route at 100 m elevation.
 * 100 m spacing → 51 points.
 *
 * Expected:
 * - ascent: 0 m
 * - descent: 0 m
 * - Naismith: (5000/5000)*3600 = 3600 s (1 h)
 * - Tobler: ≈ (5000 / 5.04) * 3600 ≈ 3571 s
 * - Difficulty: 0 → Easiest
 */
export const flatRoute: ProfilePoint[] = Array.from({ length: 51 }, (_, i) => ({
  distanceAlongM: i * 100,
  elevationM: 100,
  lat: i * 0.0009,
  lng: 0,
}));

/**
 * A 3 km route climbing steadily from 100 m to 400 m.
 * 100 m spacing → 31 points, each +10 m.
 *
 * Expected:
 * - ascent: 300 m
 * - descent: 0 m
 * - Naismith: (3000/5000)*3600 + (300/600)*3600 = 2160 + 1800 = 3960 s
 * - Tobler: slope = 0.1 (10% grade), W ≈ 3.55 km/h
 *   time = (3000/3550)*3600 ≈ 3042 s
 * - Difficulty: 300 m = 984 ft, 3 km = 1.864 mi
 *   score = sqrt(2 * 984 * 1.864) ≈ sqrt(3668) ≈ 60.6 → Moderate
 */
export const climbRoute: ProfilePoint[] = Array.from({ length: 31 }, (_, i) => ({
  distanceAlongM: i * 100,
  elevationM: 100 + i * 10,
  lat: i * 0.0009,
  lng: 0,
}));

/**
 * A 4 km rolling route: up-down-up pattern.
 * 100 m spacing → 41 points.
 *
 * Segments:
 * - 0–1000 m: climb 100→200 (gain 100)
 * - 1000–2000 m: descend 200→150 (loss 50)
 * - 2000–3000 m: climb 150→250 (gain 100)
 * - 3000–4000 m: flat 250 (no change)
 *
 * Expected:
 * - ascent: 200 m
 * - descent: 50 m
 * - Naismith: (4000/5000)*3600 + (200/600)*3600 = 2880 + 1200 = 4080 s
 * - Difficulty: 200 m = 656 ft, 4 km = 2.485 mi
 *   score = sqrt(2 * 656 * 2.485) ≈ sqrt(3260) ≈ 57.1 → Moderate
 */
function buildRolling(): ProfilePoint[] {
  const points: ProfilePoint[] = [];
  for (let i = 0; i <= 40; i++) {
    const d = i * 100;
    let e: number;
    if (d <= 1000) {
      e = 100 + (d / 1000) * 100;
    } else if (d <= 2000) {
      e = 200 - ((d - 1000) / 1000) * 50;
    } else if (d <= 3000) {
      e = 150 + ((d - 2000) / 1000) * 100;
    } else {
      e = 250;
    }
    points.push({
      distanceAlongM: d,
      elevationM: e,
      lat: i * 0.0009,
      lng: 0,
    });
  }
  return points;
}

export const rollingRoute: ProfilePoint[] = buildRolling();

/** Single point — edge case. */
export const singlePoint: ProfilePoint[] = [{ distanceAlongM: 0, elevationM: 150, lat: 0, lng: 0 }];

/** Two points, zero distance — degenerate. */
export const zeroLength: ProfilePoint[] = [
  { distanceAlongM: 0, elevationM: 100, lat: 0, lng: 0 },
  { distanceAlongM: 0, elevationM: 100, lat: 0, lng: 0 },
];
