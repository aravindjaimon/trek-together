# T7.8 — Explore map (routes near me)

> A map/list UI to browse public routes near a chosen location, backed by routes.explore.

| Field | Value |
|---|---|
| **Task ID** | T7.8 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | T6.2 |
| **Blocks** | — |
| **Labels** | frontend, map, geo |

## Context & rationale
FR-7's UI: pick a location (or use the map centre), choose a radius, and see nearby public routes
ordered by distance (PRD §6). Consumes `routes.explore` (T6.2).

## Spec references
- PRD FR-7, §6
- PROJECT-SPEC.md §7

## Implementation steps
1. Add an `/explore` route with a map; let the user set the centre and a radius.
2. Call `routes.explore` and render results as markers + a ranked list (with distance).
3. Paginate / 'load more'; link each result to its route view (T7.7).
4. Handle empty results and geolocation permission (optional 'use my location').

## Acceptance criteria
- [ ] Picking a location + radius shows nearby public routes (markers + ranked list).
- [ ] Results paginate and link to the route view.
- [ ] Empty/edge states handled.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/routes/explore.tsx`, `apps/web/src/components/ExploreMap.tsx`

## WOOLF report mapping
- *Requirement Gathering* (FR-7).

## Suggested commit(s)
- `feat(web): explore map for routes near me`
