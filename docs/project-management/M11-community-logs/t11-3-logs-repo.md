# T11.3 — Logs repo (create, listForRoute, statsForRoute)

| Field | Value |
|---|---|
| **Task ID** | T11.3 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T11.2 |
| **Blocks** | T11.4 |
| **Labels** | api, data |

## Implementation steps
1. `packages/api/src/data/logs.repo.ts`, mirroring `routes.repo.ts` style/interface:
   - `create(input)` → the persisted log.
   - `listForRoute({ routeId, page, limit })` → newest-first (uses the compound index), `limit`
     capped at 50 in the repo.
   - `statsForRoute(routeId)` via `aggregateRaw` `$match`+`$group`
     (`count`, `avgRating`, `avgActualDurationS`), decoding Extended JSON with the existing `num()`
     helper pattern.
2. Data layer owns all Mongo access (CLAUDE.md §3); no Prisma/raw-Mongo above this layer.

## Acceptance criteria
- [x] `listForRoute` returns newest-first, respects the cap.
- [x] `statsForRoute` decodes `$avg`/`$sum` Extended-JSON to plain numbers.

## Definition of Done
- [x] Unit test for the stats Extended-JSON decoding.
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/data/logs.repo.ts` (new)

## Suggested commit(s)
- `feat(logs): data-layer repo (create, listForRoute, statsForRoute)`
