# T4.3 — Routes repository (data layer)

> Own all Prisma access for routes (create, get, listByOwner, update, delete) behind a clean repository module.

| Field | Value |
|---|---|
| **Task ID** | T4.3 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T4.1 |
| **Blocks** | T4.4, T4.5, T4.6, T5.2, T5.3 |
| **Labels** | data, prisma |

## Context & rationale
The data layer owns every Prisma call (PROJECT-SPEC.md §3); services and procedures never touch Prisma
directly. Centralising route persistence here keeps procedures thin and makes the raw-Mongo geo query
(M6) sit naturally alongside normal access.

## Spec references
- PROJECT-SPEC.md §3 (data layer owns Prisma), §6
- PRD §11, §12

## Implementation steps
1. Create `apps/server/src/data/routes.repo.ts` with typed functions: `create`, `findById`, `listByOwner({ownerId, page, limit})`, `update`, `delete`.
2. Map between the Prisma document and the domain/route DTO (esp. the `path` Json ↔ GeoJSON type).
3. Centralise pagination (page/limit with a capped limit) for `listByOwner`.
4. No business logic here — persistence only.
5. Leave a placeholder for the `$geoNear` explore query (implemented in T6.1) so it lives in this layer.

## Acceptance criteria
- [x] All route persistence goes through the repo (no Prisma in services/procedures).
- [x] Pagination centralised with a capped limit (`MAX_LIMIT=100`; page/limit floored).
- [x] GeoJSON path round-trips correctly through `Json` (asserted in `routes.repo.test.ts`).

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green (137 tests).
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `packages/api/src/data/routes.repo.ts` (+ `.test.ts`), `packages/api/src/services/geojson.ts`
  — path reconciled from spec's `apps/server/src/data/` to the actual `packages/api` layering (CLAUDE.md).

## WOOLF report mapping
- *Class Diagrams (LLD)* — repository layer.

## Suggested commit(s)
- `feat(data): routes repository (crud + pagination)`
