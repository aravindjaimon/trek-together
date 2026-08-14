# T2.6 — Tobler time estimate (per-segment integration)

> Implement Tobler's slope-aware hiking function integrated per profile segment, returned in seconds.

| Field | Value |
|---|---|
| **Task ID** | T2.6 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | T2.4 |
| **Blocks** | T2.8 |
| **Labels** | domain, time |

## Context & rationale
Tobler refines Naismith by varying speed with slope (PRD §9, PROJECT-SPEC.md §5.3):
`W = 6·exp(−3.5·|S + 0.05|)` km/h, `S = Δelev/Δhoriz`. Integrating per profile segment gives a better
estimate on rolling/steep terrain. Both estimates are stored and surfaced.

## Spec references
- PROJECT-SPEC.md §5.3 (Tobler)
- PRD §9

## Implementation steps
1. Add `toblerSeconds(profile): number` in `apps/server/src/services/time.ts`.
2. For each consecutive segment compute horizontal Δ and elevation Δ → slope `S` → speed `W` (km/h) → segment time = segmentDistance / W.
3. Guard zero-length horizontal segments (avoid divide-by-zero; treat as steep).
4. Sum segment times → total seconds.
5. (Optional polish) note Langmuir descent corrections as a future refinement in code comments.

## Acceptance criteria
- [ ] On a flat fixture Tobler ≈ distance / (~5 km/h) and is close to Naismith.
- [ ] On rolling terrain Tobler differs from Naismith in the expected direction.
- [ ] No divide-by-zero on vertical/zero-horizontal segments.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/time.ts`

## WOOLF report mapping
- *Feature Development Process* / *Conclusion* — Naismith-vs-Tobler comparison.

## References
- Tobler's hiking function — https://en.wikipedia.org/wiki/Tobler%27s_hiking_function

## Suggested commit(s)
- `feat(analysis): tobler per-segment time estimate`
