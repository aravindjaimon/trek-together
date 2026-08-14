# T6.4 — Explore tests + plan verification

> Test explore correctness (proximity ordering, radius, public-only) and assert the query uses the geo index.

| Field | Value |
|---|---|
| **Task ID** | T6.4 |
| **Milestone** | M6 — Explore (routes near me) |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T6.2 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
FR-7 correctness + the index claim both need verification (PRD §13, NFR-P4). Tests assert results and
that the plan uses the `2dsphere` index (guards against silent regressions).

## Spec references
- PRD FR-7, §13, NFR-P4
- PROJECT-SPEC.md §11

## Implementation steps
1. Seed a small set of public + private routes at known locations.
2. Assert: only public routes returned; ordered nearest-first; respects `radiusM`; pagination works.
3. Assert the query plan uses the geo index (inspect `explain()` in-test).
4. Run against the test replica set; wire into `pnpm test`.

## Acceptance criteria
- [ ] Proximity ordering, radius filter, and public-only behaviour verified.
- [ ] Plan verified to use the `2dsphere` index.
- [ ] `pnpm test` green.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/explore.test.ts`

## WOOLF report mapping
- *Conclusion* — verified geo feature + index usage.

## Suggested commit(s)
- `test(explore): proximity correctness + geo-index plan check`
