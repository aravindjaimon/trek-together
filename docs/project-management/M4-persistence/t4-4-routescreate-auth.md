# T4.4 — routes.create (auth)

> Authenticated procedure to save a planned route with all derived analysis fields and isPublic.

| Field | Value |
|---|---|
| **Task ID** | T4.4 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done (behavior tests in T4.8) |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T4.3, T3.3 |
| **Blocks** | T4.7, T7.6 |
| **Labels** | api, auth |

## Context & rationale
FR-5: a user saves a route persisting the full analysis. Auth required (PROJECT-SPEC.md §7); the owner is
taken from the session, never the client. Reuses analyze output (T3.3) so saved routes carry profile,
time, and grade.

## Spec references
- PRD FR-5, §12 (`routes.create`, auth required)
- PROJECT-SPEC.md §7

## Implementation steps
1. Create `apps/server/src/routers/routes/create.ts` (auth-protected oRPC procedure).
2. Zod input: `name`, `description?`, `path` (GeoJSON), `isPublic`, plus the analysis fields (or recompute server-side via `analyzeRoute` to avoid trusting client numbers — preferred).
3. Set `ownerId` from the session context (ignore any client-supplied owner).
4. Persist via `routes.repo.create`; return the saved route (typed).
5. Reject unauthenticated calls with the typed UNAUTHORIZED error.

## Acceptance criteria
- [ ] Authenticated create persists a route with owner = session user.
- [ ] Unauthenticated calls are rejected (typed error).
- [ ] Saved route includes profile, distance, ascent/descent, times, difficulty.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/create.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-5) · *Feature Development Process*.

## Suggested commit(s)
- `feat(routes): routes.create (auth)`
