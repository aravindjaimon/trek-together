# T7.6 — Save form + listMine view

> Let an authenticated user name/describe a route, set public/private, save it, and see it in a paginated list.

| Field | Value |
|---|---|
| **Task ID** | T7.6 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | T7.3, T4.4, T4.6 |
| **Blocks** | — |
| **Labels** | frontend, auth |

## Context & rationale
FR-5's UI: persist an analyzed route and manage your own. Uses `routes.create` + `routes.listMine`
(M4); requires auth (T7.2).

## Spec references
- PRD FR-5, §6
- PROJECT-SPEC.md §7

## Implementation steps
1. Add a save form (name, description, isPublic toggle) on the analyze screen → `routes.create`.
2. Add a 'My routes' page consuming `routes.listMine` with pagination.
3. Link each item to its route view (T7.7); show difficulty/distance on the cards.
4. Guard the page for authenticated users (T7.2).

## Acceptance criteria
- [ ] Authenticated user can save an analyzed route (public or private).
- [ ] 'My routes' lists the user's routes with working pagination.
- [ ] Cards link to the route view.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/components/SaveRouteForm.tsx`, `apps/web/src/routes/my-routes.tsx`

## WOOLF report mapping
- *Requirement Gathering* (FR-5).

## Suggested commit(s)
- `feat(web): save route form + my-routes list`
