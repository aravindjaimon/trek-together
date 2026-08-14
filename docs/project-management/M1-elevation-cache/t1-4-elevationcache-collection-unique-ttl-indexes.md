# T1.4 — elevationCache collection + unique & TTL indexes

> Model the elevationCache collection keyed by quantised coordinates, with a unique key index and a TTL index on fetchedAt.

| Field | Value |
|---|---|
| **Task ID** | T1.4 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.4 |
| **Blocks** | T1.5 |
| **Labels** | database, cache, performance |

## Context & rationale
The cache is the backbone of the headline optimisation (PRD NFR-P3). Keying by **quantised**
coordinates (rounded to dataset resolution) means nearby sample points collapse to the same key and
hit cache. A **unique** index enforces one row per key; a **TTL** index expires stale points so SRTM
revisions/quotas self-heal (PROJECT-SPEC.md §6/§9).

## Spec references
- PROJECT-SPEC.md §6 (elevationCache, TTL + unique), §9
- PRD §11 (data model), FR-4

## Implementation steps
1. Add the `elevationCache` model to `schema.prisma`: `key` (quantised string/geohash, unique), `lat`, `lng`, `elevationM`, `dataset`, `fetchedAt`.
2. `pnpm db:push` to sync.
3. Because Prisma can't express TTL, add the indexes in the geo/index **setup script** (shared with T4.2) via `db.elevationCache.createIndex(...)`: unique on `key`; TTL `{ fetchedAt: 1 }, { expireAfterSeconds: <ttl> }`.
4. Decide and document the quantisation precision (≈ dataset resolution, ~30 m) and the TTL value.
5. Verify indexes via `db.elevationCache.getIndexes()`.

## Acceptance criteria
- [x] `elevationCache` exists after `db push`.
- [x] Unique index on the quantised key; TTL index on `fetchedAt` (verified via `getIndexes()`).
- [x] Quantisation precision + TTL chosen and documented.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Quantisation + TTL decision recorded for the report (T9.4).

## Files & paths
- `apps/server/prisma/schema.prisma`
- `apps/server/scripts/setup-indexes.ts` (shared with T4.2)

## WOOLF report mapping
- *Database Schema Design* — cache keying, TTL, unique index.

## References
- MongoDB TTL indexes — https://www.mongodb.com/docs/manual/core/index-ttl/

## Suggested commit(s)
- `feat(cache): elevationCache model + unique/TTL index setup`
