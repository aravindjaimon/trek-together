# T5.5 — Export + anonymous-access tests

> Verify GPX/JSON validity and that public exports work anonymously while private ones are protected.

| Field | Value |
|---|---|
| **Task ID** | T5.5 |
| **Milestone** | M5 — Share + export |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T5.1, T5.4 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
Exports are a graded functional requirement (FR-8) and a security surface (private routes). Tests lock
both correctness (valid files) and access rules.

## Spec references
- PRD FR-8, §13, NFR-S2
- PROJECT-SPEC.md §11

## Implementation steps
1. Unit-test `toGpx`/`toItineraryJson` against a fixture route (schema-valid GPX; JSON shape).
2. Integration-test `routes.exportItinerary`: public route exports anonymously (both formats).
3. Integration-test that a private route export is denied to non-owners and allowed to the owner.
4. Assert invalid `format` is rejected.

## Acceptance criteria
- [ ] GPX validates; JSON matches its schema.
- [ ] Public anonymous export works; private export protected.
- [ ] `pnpm test` green.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/export/*.test.ts`, `apps/server/src/routers/routes/export.test.ts`

## WOOLF report mapping
- *Conclusion* — verified offline export + access control.

## Suggested commit(s)
- `test(export): gpx/json validity + anonymous-access rules`
