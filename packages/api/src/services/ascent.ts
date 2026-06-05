import type { ProfilePoint } from "./elevation-profile";

export interface GainLoss {
  ascentM: number;
  descentM: number;
}

/**
 * Compute total ascent and descent (metres) from an elevation profile by
 * summing consecutive signed deltas.
 *
 * `ascentM = Σ max(0, eᵢ − eᵢ₋₁)`
 * `descentM = Σ max(0, eᵢ₋₁ − eᵢ)`
 *
 * Operates on an already-smoothed profile (caller applies T2.3 smoothing
 * beforehand). Pure, SI in / SI out.
 */
export function cumulativeGainLoss(profile: ProfilePoint[]): GainLoss {
  let ascentM = 0;
  let descentM = 0;

  for (let i = 1; i < profile.length; i++) {
    const curr = profile[i];
    const prev = profile[i - 1];
    if (!curr || !prev) continue; // unreachable: i ∈ [1, length)
    const delta = curr.elevationM - prev.elevationM;
    if (delta > 0) {
      ascentM += delta;
    } else {
      descentM += -delta;
    }
  }

  return { ascentM, descentM };
}
