# T4.7 — AuthZ + ownership enforcement

> Enforce that writes/owned-reads require a session and that only owners can edit/delete or read private routes.

| Field | Value |
|---|---|
| **Task ID** | T4.7 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done (behavior in T4.8) |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T4.4–T4.6 |
| **Blocks** | T4.8 |
| **Labels** | auth, security |

## Context & rationale
NFR-S2: writes and owned-data reads require a valid session; only `isPublic` routes are exposed
anonymously. Centralising this avoids per-procedure mistakes and is a clear security story for the
report.

## Spec references
- PRD NFR-S2, FR-5/FR-6
- PROJECT-SPEC.md §7 (auth-checked context)

## Implementation steps
1. Add an oRPC auth middleware/`protectedProcedure` that requires a session and injects `userId`.
2. Add update/delete procedures (owner-only) using an `assertOwner(routeId, userId)` helper in the service/data layer.
3. Ensure `getById` private-route path and `listMine` use the same ownership checks.
4. Return typed UNAUTHORIZED/FORBIDDEN/NOT_FOUND consistently (NOT_FOUND to avoid leaking private existence).

## Acceptance criteria
- [ ] Non-owner cannot edit/delete or read a private route.
- [ ] All write procedures require a session.
- [ ] Consistent typed authz errors.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/lib/orpc-auth.ts`, `apps/server/src/routers/routes/{update,delete}.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-1/5/6) · *Conclusion* — security model.

## Suggested commit(s)
- `feat(auth): ownership enforcement for route writes/reads`
