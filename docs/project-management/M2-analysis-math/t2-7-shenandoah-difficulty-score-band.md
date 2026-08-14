# T2.7 — Shenandoah difficulty score + band

> Compute difficulty = sqrt(2 × gain × distance) on the NPS feet+miles basis and map it to a band label.

| Field | Value |
|---|---|
| **Task ID** | T2.7 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T2.4 |
| **Blocks** | T2.8 |
| **Labels** | domain, difficulty |

## Context & rationale
Difficulty uses the Shenandoah NPS numeric rating (PRD §9 / Assumption A1, PROJECT-SPEC.md §5.4):
`difficulty = sqrt(2 × elevationGain × distance)`. The NPS bands assume **gain in feet, distance in
miles**, so convert the SI internals **at the grading boundary** and store both score and band.

## Spec references
- PROJECT-SPEC.md §5.4 (Shenandoah, bands), PRD §9, Assumption A1

## Implementation steps
1. Add `difficulty(ascentM, distanceM): { score, band }` in `apps/server/src/services/difficulty.ts`.
2. Convert ascentM→feet, distanceM→miles at the boundary; compute `score = sqrt(2 * gainFt * miles)`.
3. Map to bands: `<50` Easiest · `50–100` Moderate · `100–150` Moderately strenuous · `150–200` Strenuous · `>200` Very strenuous.
4. Store **both** numeric `difficultyScore` and `difficultyBand` (used by UI + future filters).
5. Document the unit basis in code + `docs/decisions/difficulty.md` (one basis, applied consistently).

## Acceptance criteria
- [ ] A worked NPS example reproduces the published score/band.
- [ ] Conversion happens only at the boundary; internals stay SI.
- [ ] Returns both score and band; bands match the table exactly.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] `docs/decisions/difficulty.md` records the unit basis (report material).

## Files & paths
- `apps/server/src/services/difficulty.ts`, `docs/decisions/difficulty.md`

## WOOLF report mapping
- *Feature Development Process* — grading step; *References* (NPS).

## References
- NPS Shenandoah difficulty — https://www.nps.gov/shen/planyourvisit/how-to-determine-hiking-difficulty.htm

## Suggested commit(s)
- `feat(analysis): shenandoah difficulty score + band`
