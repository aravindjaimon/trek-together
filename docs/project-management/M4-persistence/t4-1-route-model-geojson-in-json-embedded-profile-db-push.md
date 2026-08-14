# T4.1 — Route model (GeoJSON in Json, embedded profile) + db push

> Model the routes collection with GeoJSON LineString geometry, an embedded elevation profile, and all derived analysis fields.

| Field | Value |
|---|---|
| **Task ID** | T4.1 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.4 |
| **Blocks** | T4.2, T4.3 |
| **Labels** | database, prisma |

## Context & rationale
Routes persist the full analysis so views/exports need no recompute (PRD §11, PROJECT-SPEC.md §6). Geometry
is stored as embedded **GeoJSON** in a `Json` field (Prisma has no geometry type); the elevation
profile is **embedded** (read together, bounded size); the owner is **referenced** (independent
lifecycle) — these embedding-vs-referencing choices are explicit report talking points.

## Spec references
- PROJECT-SPEC.md §6 (routes collection, embed vs reference), PRD §11

## Implementation steps
1. Add the `routes` model to `schema.prisma`: `id`, `ownerId` (ref user), `name`, `description`, `path` (Json GeoJSON LineString), `elevationProfile` (embedded `[{distanceAlongM, elevationM}]`), `distanceM`, `ascentM`, `descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`, `difficultyBand`, `isPublic`, `createdAt`, `updatedAt`.
2. Add standard indexes for browsing/filtering: `ownerId`, `isPublic`, `difficultyScore`.
3. `pnpm db:push`; `prisma generate`.
4. Note that `path` validity (GeoJSON) is enforced in app code (Zod), not Prisma.
5. Document the embed-vs-reference rationale in `docs/decisions/data-model.md`.

## Acceptance criteria
- [ ] `routes` model present with all PRD §11 fields and correct types.
- [ ] `db push` syncs; client regenerated.
- [ ] Embedding/referencing rationale documented.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] `docs/decisions/data-model.md` written (feeds T9.4).

## Files & paths
- `apps/server/prisma/schema.prisma`, `docs/decisions/data-model.md`

## WOOLF report mapping
- *Database Schema Design* — schema + embed/reference decisions.

## References
- Prisma MongoDB — https://www.prisma.io/docs/orm/overview/databases/mongodb

## Suggested commit(s)
- `feat(db): routes model with geojson path + embedded profile`
