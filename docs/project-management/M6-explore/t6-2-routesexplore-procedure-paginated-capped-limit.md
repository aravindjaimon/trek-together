# T6.2 — routes.explore procedure (paginated, capped limit)

> Expose explore via oRPC: validate location + radius + pagination (capped) and return nearby public routes.

| Field | Value |
|---|---|
| **Task ID** | T6.2 |
| **Milestone** | M6 — Explore (routes near me) |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T6.1 |
| **Blocks** | T6.4, T7.8 |
| **Labels** | api, geo |

## Context & rationale
FR-7: the API surface for 'routes near me'. Auth optional (anyone can discover public routes). Thin
procedure → `exploreNear` (T6.1). Validate and cap inputs to protect the DB (PRD §12, NFR-S1).

## Spec references
- PRD FR-7, §12 (`routes.explore`, optional auth, paginated, capped limit), NFR-S1
- PROJECT-SPEC.md §7

## Implementation steps
1. Create `apps/server/src/routers/routes/explore.ts`.
2. Zod input: `lat`, `lng`, `radiusM` (sensible max), `page`, `limit` (capped).
3. Call `routes.repo.exploreNear(...)`; return items + pagination meta + per-item distance.
4. Reasonable defaults (e.g. radius default, limit default/max).

## Acceptance criteria
- [ ] Given a point + radius, returns nearby public routes ordered by proximity.
- [ ] `limit` capped; invalid coords/radius rejected (typed error).
- [ ] Works anonymously.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/explore.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-7) · *Feature Development Process*.

## Suggested commit(s)
- `feat(routes): routes.explore (geoNear, paginated)`
