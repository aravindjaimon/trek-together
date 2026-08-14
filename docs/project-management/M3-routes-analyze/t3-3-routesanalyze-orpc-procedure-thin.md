# T3.3 — routes.analyze oRPC procedure (thin)

> Expose the flagship procedure: validate input (Zod) → call analyzeRoute → return typed output. No logic in the procedure.

| Field | Value |
|---|---|
| **Task ID** | T3.3 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T3.1, T3.2 |
| **Blocks** | T4.4, T7.4 |
| **Labels** | api |

## Context & rationale
`routes.analyze` is the flagship feature and the report's feature-development deep-dive (PRD FR-3,
PROJECT-SPEC.md §7/§13). The procedure must be a thin adapter: validate, call the service, return.

## Spec references
- PROJECT-SPEC.md §7 (thin procedures), §13
- PRD §12 (`routes.analyze`, auth optional), FR-3

## Implementation steps
1. Create `apps/server/src/routers/routes/analyze.ts` as an oRPC procedure using the T3.1 schemas.
2. Auth **optional** (per §12) — works anonymously; reads context but doesn't require a session.
3. Call `analyzeRoute(input.path, input.opts)`; return the typed result.
4. Register it under the `routes` router; confirm the client gets full types end-to-end.
5. No DB calls, no math in the procedure (PROJECT-SPEC.md §3).

## Acceptance criteria
- [ ] Valid polyline → full analysis JSON; invalid → typed validation error.
- [ ] Works without authentication.
- [ ] Client (web) infers input/output types from the procedure.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/analyze.ts`, `apps/server/src/routers/routes/index.ts`

## WOOLF report mapping
- *Feature Development Process* — payload → procedure → service → cache.

## Suggested commit(s)
- `feat(routes): routes.analyze procedure (thin)`
