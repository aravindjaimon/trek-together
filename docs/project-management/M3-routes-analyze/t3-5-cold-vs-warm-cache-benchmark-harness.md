# T3.5 — Cold-vs-warm cache benchmark harness

> Measure routes.analyze latency cold (empty cache) vs. warm (all cached) and record the headline numbers + hit ratio.

| Field | Value |
|---|---|
| **Task ID** | T3.5 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T3.3 |
| **Blocks** | T9.7 |
| **Labels** | performance, benchmark, report |

## Context & rationale
This is the report's **headline optimisation** (PRD NFR-P3, PROJECT-SPEC.md §9). A repeatable harness that
clears the cache, runs analyze (cold), runs it again (warm), and records latency + hit ratio turns the
caching work into hard evidence — captured in `docs/` as produced, not reconstructed later.

## Spec references
- PROJECT-SPEC.md §9 (measure cold vs warm), §13
- PRD NFR-P1/P2/P3, §13

## Implementation steps
1. Add `apps/server/scripts/bench-analyze.ts`: pick a representative real route polyline.
2. Cold run: clear `elevationCache`, time `analyzeRoute`/the procedure, record latency + miss count.
3. Warm run: immediately re-run, record latency + hit ratio (expect ~100% hits, big speed-up).
4. Repeat N times; report p50/p95 for warm and the single cold figure (cold is bounded by the API).
5. Write results to `docs/benchmarks/cache.md` (table + method + machine/notes).

## Acceptance criteria
- [ ] Harness runs cold then warm and prints latency + hit ratio.
- [ ] Warm p95 and the cold figure recorded in `docs/benchmarks/cache.md`.
- [ ] Method is documented and repeatable.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] `docs/benchmarks/cache.md` committed (feeds report + T9.7).

## Files & paths
- `apps/server/scripts/bench-analyze.ts`, `docs/benchmarks/cache.md`

## WOOLF report mapping
- *Feature Development Process* — the measured improvement (primary benchmark).

## References
- PROJECT-SPEC.md §9

## Suggested commit(s)
- `perf(routes): cold-vs-warm analyze benchmark + results`
