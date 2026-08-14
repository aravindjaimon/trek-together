# T5.3 — JSON itinerary export builder

> Serialize a route to a self-contained JSON itinerary (geometry, profile, metrics, time, difficulty, notes).

| Field | Value |
|---|---|
| **Task ID** | T5.3 |
| **Milestone** | M5 — Share + export |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T4.3 |
| **Blocks** | T5.4 |
| **Labels** | export, offline |

## Context & rationale
FR-8: a JSON export captures everything the app knows about a route in one offline file — handy for the
PWA cache (M8) and for re-import/preview. All values are precomputed (PRD §5.5).

## Spec references
- PRD FR-8, §5.5
- PROJECT-SPEC.md §5.5

## Implementation steps
1. Create `apps/server/src/services/export/json.ts` exporting `toItineraryJson(route)`.
2. Include: `path` (GeoJSON), `elevationProfile`, `distanceM`, `ascentM`, `descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`, `difficultyBand`, `name`, `description`, waypoints/notes, and a schema `version`.
3. Define/document the JSON schema so it's a stable contract.
4. Keep pure; unit-test the shape.

## Acceptance criteria
- [ ] JSON contains all geometry + derived fields and a version tag.
- [ ] Opens/parses with no network; schema documented.
- [ ] Pure function; unit-tested.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/export/json.ts`, `docs/api/itinerary.schema.json`

## WOOLF report mapping
- *Requirement Gathering* (FR-8).

## Suggested commit(s)
- `feat(export): json itinerary builder`
