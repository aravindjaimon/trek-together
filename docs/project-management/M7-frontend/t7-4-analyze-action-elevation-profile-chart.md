# T7.4 — Analyze action + elevation profile chart

> Call routes.analyze for the plotted line and render the elevation profile plus distance/ascent/time results.

| Field | Value |
|---|---|
| **Task ID** | T7.4 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T7.3, T3.3 |
| **Blocks** | T7.5 |
| **Labels** | frontend, map, viz |

## Context & rationale
Connects the planner (T7.3) to the flagship procedure (T3.3) and visualises the result — the moment
the product 'works'. The chart plots elevation vs. distance-along-route.

## Spec references
- PRD FR-3, §6
- PROJECT-SPEC.md §5

## Implementation steps
1. Add an 'Analyze' action that sends the GeoJSON LineString to `routes.analyze` (typed client).
2. Render an elevation profile chart (elevation vs. distanceAlongM) from `elevationProfile`.
3. Show distance, ascent/descent, and both time estimates (Naismith + Tobler).
4. Handle loading + the typed error envelope (e.g. ELEVATION_UNAVAILABLE) gracefully.
5. Keep units converted at the UI boundary (m/km, s/h).

## Acceptance criteria
- [ ] Analyze returns and the profile chart + metrics render for a plotted route.
- [ ] Both time estimates and ascent/descent shown.
- [ ] Loading + error states handled.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/components/ElevationProfile.tsx`, `apps/web/src/components/AnalysisPanel.tsx`

## WOOLF report mapping
- *Feature Development Process* — the user-facing flagship flow.

## Suggested commit(s)
- `feat(web): analyze action + elevation profile chart`
