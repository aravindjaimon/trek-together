# T7.5 — Difficulty badge + time/ascent summary

> Present the difficulty band as a clear badge alongside a compact summary of the key metrics.

| Field | Value |
|---|---|
| **Task ID** | T7.5 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T7.4 |
| **Blocks** | — |
| **Labels** | frontend, viz |

## Context & rationale
The grade is the headline number for a hiker. A colour-coded badge (Easiest → Very strenuous) plus a
tidy metric summary makes the analysis instantly legible (PRD §5.4/§9).

## Spec references
- PRD FR-3, §9 (bands)
- PROJECT-SPEC.md §5.4

## Implementation steps
1. Build `DifficultyBadge` mapping `difficultyBand` to a label + colour.
2. Build a compact summary (distance, ascent/descent, Naismith/Tobler time, score).
3. Reuse across the analyze panel (T7.4) and the route view (T7.7).
4. Keep accessible (text + colour, not colour alone).

## Acceptance criteria
- [ ] Badge reflects the band with an accessible label + colour.
- [ ] Summary shows the key metrics with correct units.
- [ ] Reused by analyze + route view.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/components/DifficultyBadge.tsx`, `apps/web/src/components/MetricSummary.tsx`

## WOOLF report mapping
- *Feature Development Process*.

## Suggested commit(s)
- `feat(web): difficulty badge + metric summary`
