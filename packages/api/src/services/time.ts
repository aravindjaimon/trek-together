import type { ProfilePoint } from "./elevation-profile";

const KPH_TO_MPS = 1000 / 3600;

/**
 * Naismith's rule: 1 hour per 5 km of distance + 1 hour per 600 m of ascent.
 *
 * Returns estimated hiking time in seconds (SI).
 *
 * Flat walking speed: 5 km/h = 5000 m / 3600 s
 * Ascent penalty: 1 hour per 600 m climb = 3600 s / 600 m
 */
export function naismithSeconds(distanceM: number, ascentM: number): number {
  return (distanceM / 5000) * 3600 + (ascentM / 600) * 3600;
}

/**
 * Tobler's hiking function: speed varies with slope.
 *
 * `W = 6 · exp(−3.5 · |S + 0.05|)`  (km/h), where S = Δelev / Δhoriz.
 *
 * Peak speed ≈ 6 km/h at −5% grade (gentle downhill). Speed decays
 * exponentially as terrain steepens in either direction. Time is computed by
 * integrating per profile segment: segment time = dh / W.
 *
 * Near-zero horizontal deltas (dh < 0.5 m) use a fixed slow vertical rate of
 * 300 m/h to avoid division-by-zero. This affects only artificial fixtures
 * since the densified profile guarantees ~60 m spacing in real routing.
 *
 * Langmuir descent corrections are noted as a future refinement.
 */
export function toblerSeconds(profile: ProfilePoint[]): number {
  if (profile.length < 2) return 0;

  let totalS = 0;

  for (let i = 1; i < profile.length; i++) {
    const dh = profile[i].distanceAlongM - profile[i - 1].distanceAlongM;
    const de = profile[i].elevationM - profile[i - 1].elevationM;

    if (dh < 0.5) {
      // Near-vertical guard: use fixed vertical rate
      const d3d = Math.sqrt(dh * dh + de * de);
      totalS += d3d / (300 / 3600); // 300 m/h vertical rate
      continue;
    }

    const slope = de / dh;
    const speedKph = 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
    const speedMps = speedKph * KPH_TO_MPS;
    totalS += dh / speedMps;
  }

  return totalS;
}
