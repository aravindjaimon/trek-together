# T7.2 — Auth UI (register/login/logout, persistence)

> Build register/login/logout screens and a session-aware shell so protected actions work and persist across reloads.

| Field | Value |
|---|---|
| **Task ID** | T7.2 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T7.1 |
| **Blocks** | T7.6 |
| **Labels** | frontend, auth |

## Context & rationale
FR-1's user-facing half: account screens + a session-aware layout (show user, guard owner-only pages).
Sessions must persist across reloads (PRD FR-1).

## Spec references
- PRD FR-1, §6 (User stories)
- PROJECT-SPEC.md §2

## Implementation steps
1. Add `/register`, `/login` routes (TanStack Router) using the auth client (T7.1); show validation/errors.
2. Add logout + a header showing the signed-in user.
3. Add a route guard/loader that redirects unauthenticated users away from owner-only pages (e.g. "my routes").
4. Verify the session survives a full reload.

## Acceptance criteria
- [ ] Register → login → logout all work from the UI.
- [ ] Session persists across reload; header reflects auth state.
- [ ] Owner-only routes are guarded.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/routes/(auth)/*`, `apps/web/src/components/AuthHeader.tsx`

## WOOLF report mapping
- *Requirement Gathering* (FR-1).

## Suggested commit(s)
- `feat(web): auth screens + session-aware shell`
