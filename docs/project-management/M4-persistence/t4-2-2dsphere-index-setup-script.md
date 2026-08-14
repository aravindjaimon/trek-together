# T4.2 — 2dsphere index setup script

> Create the 2dsphere index on routes.path (and any point field) outside Prisma via a repeatable setup script.

| Field | Value |
|---|---|
| **Task ID** | T4.2 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T4.1 |
| **Blocks** | T6.1 |
| **Labels** | database, geo, performance |

## Context & rationale
Prisma can't declare geo indexes (PROJECT-SPEC.md §6 gotcha 2). The `2dsphere` index on `routes.path` is
what makes `$geoNear` explore (M6) fast, and the before/after of adding it is the **secondary
benchmark** (NFR-P4). A single idempotent script (shared with the elevationCache indexes from T1.4)
keeps setup reproducible.

## Spec references
- PROJECT-SPEC.md §6 (2dsphere outside Prisma), §9
- PRD FR-7, NFR-P4, Assumption A2

## Implementation steps
1. Extend `apps/server/scripts/setup-indexes.ts` (created in T1.4) to also create `routes` `2dsphere` on `path` via `prisma.$runCommandRaw({ createIndexes: "routes", indexes: [...] })` or mongosh.
2. Make it idempotent (safe to re-run) and runnable via a pnpm script (`pnpm db:indexes`).
3. Verify with `db.routes.getIndexes()`.
4. Document running it **after** every `db push` (note in README/PROJECT-SPEC.md §8).
5. Keep an "indexes off" path/flag to support the T6.3 benchmark.

## Acceptance criteria
- [ ] `2dsphere` index on `routes.path` exists after running the script.
- [ ] Script is idempotent and wired to a pnpm command.
- [ ] "Run after db push" documented.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] README/PROJECT-SPEC.md §8 note the post-`db push` step (T0.8/T9.1).

## Files & paths
- `apps/server/scripts/setup-indexes.ts`

## WOOLF report mapping
- *Database Schema Design* — geo index; basis of NFR-P4.

## References
- MongoDB 2dsphere — https://www.mongodb.com/docs/manual/geospatial-queries/

## Suggested commit(s)
- `feat(db): 2dsphere index setup script for routes.path`
