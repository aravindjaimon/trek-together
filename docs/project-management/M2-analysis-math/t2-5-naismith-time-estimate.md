# T2.5 — Naismith time estimate

> Implement the Naismith baseline: 1 h per 5 km of distance + 1 h per 600 m of ascent, returned in seconds.

| Field | Value |
|---|---|
| **Task ID** | T2.5 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T2.1 |
| **Blocks** | T2.8 |
| **Labels** | domain, time |

## Context & rationale
Naismith is the simple, citable baseline time estimate (PRD §9, PROJECT-SPEC.md §5.3). Implement it first;
Tobler (T2.6) is the refinement. Output seconds (SI).

## Spec references
- PROJECT-SPEC.md §5.3 (Naismith)
- PRD §9

## Implementation steps
1. Add `naismithSeconds(distanceM, ascentM): number` in `apps/server/src/services/time.ts`.
2. `time = distanceM / (5000/3600) + ascentM / (600/3600)` — i.e. 5 km/h flat + 1 h per 600 m climb.
3. Keep inputs SI; return seconds; no rounding inside (round at the edge).

## Acceptance criteria
- [ ] 10 km flat → ~2 h; +600 m ascent → +1 h (asserted in tests).
- [ ] Pure, SI in/out.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/time.ts`

## WOOLF report mapping
- *Feature Development Process* — baseline time model (compared to community/typical times in §13).

## References
- Naismith's rule — https://en.wikipedia.org/wiki/Naismith%27s_rule

## Suggested commit(s)
- `feat(analysis): naismith time estimate`
