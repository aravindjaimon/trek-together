# M2 — Analysis math

> Implement the pure, unit-tested domain math that turns an elevation profile into ascent/descent, time, and a difficulty grade.

## Why this milestone

This is the graded core of a backend capstone: documented, citable formulas implemented as pure
functions and locked down with golden fixtures (PRD §9/§13, PROJECT-SPEC.md §5/§11). Keeping each stage
(densify → sample → smooth → gain/loss → time → grade) separate and pure makes them individually
testable and makes the smoothing/units decisions easy to document — both required by the report.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T2.1](./t2-1-geo-utils-haversine-polyline-densification.md) | Geo utils: haversine + polyline densification | P0 | 1d | T0.2 |
| [T2.2](./t2-2-elevation-sampling-pipeline.md) | Elevation sampling pipeline | P0 | 1d | T1.5, T2.1 |
| [T2.3](./t2-3-smoothing-minimum-change-threshold.md) | Smoothing / minimum-change threshold | P0 | 0.5d | T2.2 |
| [T2.4](./t2-4-ascent-descent-computation.md) | Ascent / descent computation | P0 | 0.5d | T2.3 |
| [T2.5](./t2-5-naismith-time-estimate.md) | Naismith time estimate | P0 | 0.5d | T2.1 |
| [T2.6](./t2-6-tobler-time-estimate-per-segment-integration.md) | Tobler time estimate (per-segment integration) | P1 | 1d | T2.4 |
| [T2.7](./t2-7-shenandoah-difficulty-score-band.md) | Shenandoah difficulty score + band | P0 | 0.5d | T2.4 |
| [T2.8](./t2-8-unit-tests-against-known-fixtures.md) | Unit tests against known fixtures | P0 | 1d | T2.4–T2.7 |

## Entry criteria (what must be true before starting)

- M1 cache wrapper available (`getElevations()`); Vitest configured.

## Exit criteria (milestone is done when…)

- A polyline can be turned into a validated elevation profile.
- Ascent/descent, Naismith, Tobler, and Shenandoah grade all computed and unit-tested.
- Smoothing and unit-basis decisions documented under `docs/decisions/`.

## WOOLF report artifacts produced here

- *Feature Development Process* — every step of the analysis pipeline.
- *References* — Naismith, Tobler, NPS difficulty.
- *Conclusion* — verified formulas, worked examples, Naismith-vs-Tobler comparison.
