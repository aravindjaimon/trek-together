# T7.3 — Leaflet map + route planner

> Add a Leaflet/OSM map where clicking adds polyline vertices with a live line, running distance, and vertex removal.

| Field | Value |
|---|---|
| **Task ID** | T7.3 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P0 |
| **Estimate** | 1.5d |
| **Depends on** | T7.1 |
| **Blocks** | T7.4, T7.6 |
| **Labels** | frontend, map |

## Context & rationale
FR-2: the core plotting experience. Leaflet + free OSM tiles (no token), captured as a GeoJSON
LineString to feed `routes.analyze`. OSM tile usage policy (User-Agent + attribution) must be honoured
(PRD NFR-S3, PROJECT-SPEC.md §2).

## Spec references
- PRD FR-2, §6
- PROJECT-SPEC.md §2 (Leaflet/react-leaflet), NFR-S3 (OSM policy)

## Implementation steps
1. Add `react-leaflet` + Leaflet CSS to `apps/web`.
2. Render an OSM tile layer **with attribution**; set a proper app identity per OSM policy.
3. Click to append a vertex; render the polyline live; allow removing the last/selected vertex; clear.
4. Show a running total distance (client haversine) as the line grows.
5. Expose the current geometry as a GeoJSON `LineString` for the analyze action (T7.4).

## Acceptance criteria
- [ ] Clicking adds vertices; the line + running distance update live; vertices can be removed.
- [ ] Geometry is available as a GeoJSON LineString.
- [ ] OSM attribution shown; tile policy respected.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/components/Map.tsx`, `apps/web/src/components/RoutePlanner.tsx`

## WOOLF report mapping
- *Requirement Gathering* (FR-2) · *Technologies Used* (Leaflet/OSM).

## References
- Leaflet — https://leafletjs.com/ · OSM tile policy — https://operations.osmfoundation.org/policies/tiles/

## Suggested commit(s)
- `feat(web): leaflet map + interactive route planner`
