# T3.2 — Analysis service orchestration

> Compose the M2 math + M1 cache into one analyzeRoute(path) service returning the full analysis object.

| Field | Value |
|---|---|
| **Task ID** | T3.2 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T1.5, T2.2–T2.7 |
| **Blocks** | T3.3 |
| **Labels** | service, domain |

## Context & rationale
The procedure must stay thin (PROJECT-SPEC.md §3), so the orchestration lives in a service: profile (T2.2) →
smoothing (T2.3) → ascent/descent (T2.4) → Naismith (T2.5) + Tobler (T2.6) → difficulty (T2.7).

## Spec references
- PROJECT-SPEC.md §3 (services hold logic), §5
- PRD FR-3, §9

## Implementation steps
1. Create `apps/server/src/services/analyze.ts` exporting `analyzeRoute(path, opts)`.
2. Call the pipeline in order; assemble `{ elevationProfile, distanceM, ascentM, descentM, estTimeNaismithS, estTimeToblerS, difficultyScore, difficultyBand }`.
3. Convert SI→API units only where the schema requires (keep internals SI).
4. Thread through cache hit/miss counters (from T1.5) for the benchmark + optional response meta.
5. Keep it framework-free (no Express/oRPC imports) so it is unit-testable in isolation.

## Acceptance criteria
- [ ] `analyzeRoute()` returns an object satisfying the T3.1 output schema.
- [ ] No HTTP/oRPC imports in the service.
- [ ] Cache hit/miss observable for T3.5.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/analyze.ts`

## WOOLF report mapping
- *Class Diagrams (LLD)* · *Feature Development Process*.

## Suggested commit(s)
- `feat(analysis): analyzeRoute service orchestration`
