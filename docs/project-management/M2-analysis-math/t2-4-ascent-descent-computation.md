# T2.4 — Ascent / descent computation

> Compute total ascent and descent (metres) from the smoothed profile by summing signed consecutive deltas.

| Field | Value |
|---|---|
| **Task ID** | T2.4 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T2.3 |
| **Blocks** | T2.6, T2.7, T2.8 |
| **Labels** | domain, elevation |

## Context & rationale
Ascent/descent feed both time (Naismith/Tobler) and difficulty. Definition (PRD §9, PROJECT-SPEC.md §5.2):
`ascent = Σ max(0, eₙ − eₙ₋₁)`, `descent = Σ max(0, eₙ₋₁ − eₙ)`, computed on the **smoothed** profile.

## Spec references
- PROJECT-SPEC.md §5.2
- PRD §9

## Implementation steps
1. Add `cumulativeGainLoss(profile): { ascentM, descentM }` in `apps/server/src/services/terrain.ts`.
2. Sum positive deltas → ascent, negative deltas → descent over consecutive points.
3. Operate on the smoothed profile from T2.3 (caller passes it in; keep the function pure).
4. Return metres (SI); conversion happens only at the grading/UI boundary.

## Acceptance criteria
- [ ] A fixture with a known up-then-down profile returns the exact expected ascent/descent.
- [ ] Flat/with-noise fixtures return ~0 ascent after smoothing.
- [ ] Pure function; metres in, metres out.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/terrain.ts`

## WOOLF report mapping
- *Feature Development Process* — ascent/descent step.

## Suggested commit(s)
- `feat(analysis): cumulative ascent/descent from smoothed profile`
