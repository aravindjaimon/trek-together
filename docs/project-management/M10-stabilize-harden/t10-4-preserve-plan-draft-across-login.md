# T10.4 — Preserve plan draft across login (sessionStorage)

> A guest who draws a route and clicks "Sign in to save" loses the whole draft — the core
> plan→save funnel dead-ends.

| Field | Value |
|---|---|
| **Task ID** | T10.4 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.25d |
| **Depends on** | T10.2 |
| **Blocks** | — |
| **Labels** | web, planner, auth |

## Context & rationale
Waypoints live in `PlanPage` component state; navigating to `/login` unmounts the page. Redirect
plumbing wouldn't help — state dies on unmount either way — so persist the draft.

## Implementation steps
1. Write waypoints to `sessionStorage` (`plan:draft`) in `commit()`.
2. Restore in the `useState` initializer; re-snap on mount when ≥2 restored.
3. Clear on successful save and on explicit Clear.

## Acceptance criteria
- [x] Guest draws ≥2 waypoints → signs in → lands on `/plan` with route intact → saves.
- [x] Draft cleared after save/Clear; no stale restore on the next visit.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/plan.tsx`

## Suggested commit(s)
- `fix(web): persist plan draft across login (sessionStorage)`
