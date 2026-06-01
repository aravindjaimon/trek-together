import type { ProfilePoint } from "./elevation-profile";

export interface SmoothingOptions {
  /**
   * Number of points in the centred moving-average window.
   * Use an odd positive integer. Default: 5.
   * Set to `1` to disable MA smoothing.
   */
  windowSize?: number;
  /**
   * Minimum elevation delta (metres) that counts as a real change.
   * Smaller consecutive deltas are clamped — the elevation stays at the
   * previous value. Default: 3 m (per PROJECT-SPEC.md §5.2).
   * Set to `0` to disable the threshold.
   */
  minChangeThresholdM?: number;
}

/**
 * Smooth an elevation profile to reduce SRTM noise.
 *
 * Applies two independent, composable stages in order:
 * 1. **Centred moving average** — replaces each point's elevation with the
 *    mean of its neighbours within `windowSize` (asymmetric at profile edges).
 * 2. **Minimum-change threshold** — clamps consecutive elevation deltas whose
 *    absolute value is below `minChangeThresholdM` to zero, preventing trivial
 *    noise from inflating ascent/descent totals.
 *
 * Both stages are pure. The caller controls whether smoothing is applied before
 * or after other profile transformations.
 *
 * See `docs/decisions/smoothing.md` for the rationale and before/after example.
 */
export function smoothProfile(
  profile: ProfilePoint[],
  opts: SmoothingOptions = {},
): ProfilePoint[] {
  const windowSize = opts.windowSize ?? 5;
  const threshold = opts.minChangeThresholdM ?? 3;

  if (profile.length === 0) return [];

  const smoothed = movingAverage(profile, windowSize);
  if (threshold <= 0) return smoothed;
  return applyMinChangeThreshold(smoothed, threshold);
}

function movingAverage(profile: ProfilePoint[], windowSize: number): ProfilePoint[] {
  if (windowSize <= 1) return profile.map((p) => ({ ...p }));

  const radius = Math.floor(windowSize / 2);
  return profile.map((point, i) => {
    let sum = 0;
    let count = 0;
    // Use an asymmetric window near edges: [(i-radius).clamp, (i+radius).clamp]
    const start = Math.max(0, i - radius);
    const end = Math.min(profile.length - 1, i + radius);
    for (let j = start; j <= end; j++) {
      sum += profile[j].elevationM;
      count++;
    }
    return { ...point, elevationM: sum / count };
  });
}

function applyMinChangeThreshold(profile: ProfilePoint[], thresholdM: number): ProfilePoint[] {
  const out: ProfilePoint[] = [profile[0]];
  for (let i = 1; i < profile.length; i++) {
    const prev = out[i - 1];
    const curr = profile[i];
    const delta = Math.abs(curr.elevationM - prev.elevationM);
    if (delta < thresholdM) {
      out.push({ ...curr, elevationM: prev.elevationM });
    } else {
      out.push({ ...curr });
    }
  }
  return out;
}
