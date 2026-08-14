# T2.3 — Smoothing / minimum-change threshold

> Reduce SRTM noise via light smoothing and/or a ~3–5 m minimum-change threshold before ascent/descent is summed.

| Field | Value |
|---|---|
| **Task ID** | T2.3 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T2.2 |
| **Blocks** | T2.4 |
| **Labels** | domain, elevation |

## Context & rationale
Raw SRTM elevation is noisy; summing it directly inflates ascent/descent and therefore the difficulty
grade (PRD §9, PROJECT-SPEC.md §5.2). A small moving average and/or a 3–5 m minimum-change threshold fixes
this. The **chosen method must be documented** because it changes the grade.

## Spec references
- PROJECT-SPEC.md §5.2 (smoothing / 3–5 m threshold, document it)
- PRD §9

## Implementation steps
1. Add `smoothProfile(profile, opts)` in `apps/server/src/services/smoothing.ts` (e.g. moving average window and/or min-delta threshold).
2. Make parameters explicit and configurable; default to a documented choice (e.g. 5-point MA + 3 m threshold).
3. Keep it pure and separate from ascent/descent (T2.4) so its effect can be A/B-measured.
4. Write a short `docs/decisions/smoothing.md` capturing the choice + a before/after example (report material).

## Acceptance criteria
- [ ] Smoothing reduces ascent on a noisy fixture vs. raw, without erasing real climbs.
- [ ] Parameters are explicit; defaults documented in `docs/`.
- [ ] Function is pure and independently tested.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] `docs/decisions/smoothing.md` written (feeds report §9 narrative).

## Files & paths
- `apps/server/src/services/smoothing.ts`, `docs/decisions/smoothing.md`

## WOOLF report mapping
- *Feature Development Process* — documented smoothing decision.

## Suggested commit(s)
- `feat(analysis): elevation smoothing + min-change threshold`
