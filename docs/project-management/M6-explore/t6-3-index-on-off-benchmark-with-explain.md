# T6.3 — Index on/off benchmark with explain()

> Benchmark the explore query with vs. without the 2dsphere index, capturing explain('executionStats') as the secondary optimisation.

| Field | Value |
|---|---|
| **Task ID** | T6.3 |
| **Milestone** | M6 — Explore (routes near me) |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T6.1 |
| **Blocks** | T9.7 |
| **Labels** | performance, benchmark, report |

## Context & rationale
NFR-P4: the secondary benchmark. Compare the `$geoNear`/explore query plan and timing **with** and
**without** the `2dsphere` index, capturing `explain("executionStats")` — concrete evidence the index
matters (PROJECT-SPEC.md §9). Seed enough routes for the difference to show.

## Spec references
- PROJECT-SPEC.md §9 (index benchmark, explain), §13
- PRD NFR-P4, §13

## Implementation steps
1. Add `apps/server/scripts/bench-explore.ts`: seed N public routes with varied geometry (e.g. 1k–10k).
2. Run the explore query and capture `explain("executionStats")` + timing **with** the index.
3. Drop the `2dsphere` index (or use the T4.2 "indexes off" path), re-run, capture plan + timing (expect COLLSCAN / much slower).
4. Recreate the index; confirm fast plan returns.
5. Write `docs/benchmarks/index.md` (before/after timings, `nReturned`/`totalDocsExamined`, the two plans).

## Acceptance criteria
- [ ] Benchmark runs both with/without the index and records timings + plans.
- [ ] `docs/benchmarks/index.md` shows the index path (IXSCAN/geo) vs. collection scan.
- [ ] Index is restored at the end.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] `docs/benchmarks/index.md` committed (feeds report + T9.7).

## Files & paths
- `apps/server/scripts/bench-explore.ts`, `docs/benchmarks/index.md`

## WOOLF report mapping
- *Database Schema Design* / *Feature Development Process* — measured index benefit (NFR-P4).

## References
- explain() — https://www.mongodb.com/docs/manual/reference/method/cursor.explain/

## Suggested commit(s)
- `perf(explore): 2dsphere index on/off benchmark + results`
