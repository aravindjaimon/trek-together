# T2.8 — Unit tests against known fixtures

> Lock the domain math with golden-fixture tests: a route with known ascent → known Naismith/Tobler time → known grade.

| Field | Value |
|---|---|
| **Task ID** | T2.8 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T2.4–T2.7 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
The domain math is the graded core (PRD §13 Quality, PROJECT-SPEC.md §5/§11). Golden fixtures make the
formulas regression-proof and double as worked examples in the report.

## Spec references
- PROJECT-SPEC.md §5 (known fixtures), §11
- PRD §13 (Quality)

## Implementation steps
1. Build 2–3 fixtures: a flat route, a single-climb route, and a rolling route (hand-computable expectations).
2. Assert each stage: densify spacing, profile, smoothing effect, ascent/descent, Naismith, Tobler, difficulty score+band.
3. Include an edge fixture (single point / zero-length) → graceful behaviour.
4. Keep fixtures in a shared file reused by the M3 integration tests (T3.6).
5. Ensure `pnpm test` runs them with no network (elevation mocked/stubbed).

## Acceptance criteria
- [ ] Each pipeline stage asserted against hand-computed expected values.
- [ ] Difficulty score+band and both time estimates verified on the climb fixture.
- [ ] `pnpm test` green offline.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Fixtures documented as worked examples for the report.

## Files & paths
- `apps/server/src/services/__fixtures__/`, `apps/server/src/services/*.test.ts`

## WOOLF report mapping
- *Feature Development Process* / *Conclusion* — verified formulas + worked examples.

## Suggested commit(s)
- `test(analysis): golden-fixture coverage for the math pipeline`
