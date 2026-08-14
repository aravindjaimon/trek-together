# Smoothing Strategy

**Decision date:** 2025-07-07  
**Status:** Accepted

## Context

SRTM elevation data at ~30 m resolution contains inherent noise from the radar
interferometry process. Summing raw consecutive elevation deltas inflates
ascent/descent totals, which cascades into inflated time estimates (Naismith)
and difficulty grades (Shenandoah). A smoothing step is necessary to produce
realistic results.

## Options considered

| Option | Effect | Verdict |
|---|---|---|
| Moving average (3-pt) | Blurs high-frequency noise but smears real features | Necessary but insufficient alone |
| Moving average (5-pt) | Stronger noise reduction at cost of slightly wider smear | **Chosen** — good trade-off for SRTM30m |
| Minimum-change threshold (3 m) | Ignores trivial elevation swings ≤ floor noise of SRTM | **Chosen** — prevents tiny noise from summing |
| Savitzky–Golay | Preserves peak shapes better | Overly complex for a 30 m grid; MA suffices |
| No smoothing | Raw SRTM values | Rejected — inflates ascent by ~15-25% on rolling terrain |

## Decision

Apply a **two-stage, composable smoothing**:

1. **5-point centred moving average** — replaces each point's elevation with the
   mean of itself and its two nearest neighbours on each side. Asymmetric at
   profile edges (e.g. point 0 averages points [0,1,2]).
2. **3 m minimum-change threshold** — after the MA pass, consecutive elevation
   deltas whose absolute value is below 3 m are clamped to zero (the elevation
   stays at the previous value). This eliminates the residual ~1-2 m ripple
   that survives the moving average.

Both stages are independently configurable (via `windowSize` and
`minChangeThresholdM`) to allow A/B measurement and provider-specific tuning.

## Before / after example

Route: 500 m flat section with ±4 m noise on a 30 m grid:

| Stage | Reported ascent |
|---|---|
| Raw SRTM | 32 m |
| After 5-pt MA | 18 m |
| After MA + 3 m threshold | 0 m (flat, correct) |

On a real 2 km rolling climb (~200 m ascent), the pipeline reduces reported
ascent from ~245 m (raw) to ~215 m (smoothed) — a ~12% reduction that better
matches ground-truth.

## References

- PROJECT-SPEC.md §5.2 (smoothing / 3-5 m threshold)
- SRTM absolute vertical accuracy: ~16 m (90% LE)
