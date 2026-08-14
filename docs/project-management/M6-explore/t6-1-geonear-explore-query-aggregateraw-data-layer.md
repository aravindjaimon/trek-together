# T6.1 — $geoNear explore query (aggregateRaw, data layer)

> Implement a raw-Mongo $geoNear aggregation in the data layer that returns public routes near a point, ordered by distance.

| Field | Value |
|---|---|
| **Task ID** | T6.1 |
| **Milestone** | M6 — Explore (routes near me) |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T4.2 |
| **Blocks** | T6.2, T6.3 |
| **Labels** | data, geo, performance |

## Context & rationale
FR-7 + Assumption A2: 'routes near me' runs `$geoNear` against the `2dsphere`-indexed `routes.path`
(distance to the nearest point on the line). Prisma can't express geo operators, so this lives in the
data layer via `aggregateRaw`/`$runCommandRaw` (PROJECT-SPEC.md §3/§6). User input must be validated and
never string-concatenated into the query (NFR-S1).

## Spec references
- PROJECT-SPEC.md §3 (raw geo in data layer), §6, §9
- PRD FR-7, NFR-S1, Assumption A2

## Implementation steps
1. Add `exploreNear({ lng, lat, radiusM, page, limit })` to `apps/server/src/data/routes.repo.ts`.
2. Build a `$geoNear` aggregation (must be the first stage): `near: { type: 'Point', coordinates: [lng, lat] }`, `distanceField: 'distanceM'`, `maxDistance: radiusM`, `spherical: true`, `query: { isPublic: true }`.
3. Pass coordinates as typed numbers (validated upstream) — never interpolate strings into the pipeline.
4. Add pagination (`$skip`/`$limit`) after `$geoNear`; project the list/card fields.
5. Return items + each route's computed distance from the point.

## Acceptance criteria
- [ ] Returns only public routes within `radiusM`, ordered nearest-first, each with a distance.
- [ ] Coordinates are numeric/validated; no string concatenation into the pipeline.
- [ ] Pagination applied after `$geoNear`.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/data/routes.repo.ts` (`exploreNear`)

## WOOLF report mapping
- *Database Schema Design* / *Feature Development Process* — geospatial query design.

## References
- MongoDB `$geoNear` — https://www.mongodb.com/docs/manual/reference/operator/aggregation/geoNear/

## Suggested commit(s)
- `feat(data): $geoNear explore query for nearby public routes`
