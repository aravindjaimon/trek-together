# T10.2 — Snap race guard + 25-waypoint client cap

> Out-of-order snap responses can draw stale geometry; the 26th click triggers a misleading
> "Couldn't follow a trail" toast loop.

| Field | Value |
|---|---|
| **Task ID** | T10.2 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.25d |
| **Depends on** | T10.1 |
| **Blocks** | — |
| **Labels** | web, planner |

## Context & rationale
`PlanPage.commit()` fires `snap.mutate` per change; each call's `onSuccess` runs when *its* request
resolves, so a slow N-point response landing after the N+1-point response desyncs the drawn line
from the waypoint dots. Separately, the server caps snap at 25 waypoints (Mapbox per-request limit)
but the client lets you keep clicking into a Zod rejection.

## Implementation steps
1. Monotonic sequence ref in `plan.tsx` `commit()`; `onSuccess`/`onError` apply state only if their
   seq is still the latest.
2. In the map-click path: at 25 waypoints, toast "Waypoint limit reached (25)" and ignore the click.
   Constant hardcoded client-side (server code isn't imported into the web bundle).

## Acceptance criteria
- [x] Rapid clicking never leaves the polyline inconsistent with the waypoints.
- [x] The 26th click produces one clear cap toast, not a failing snap request.

## Definition of Done
- [x] `pnpm check-types` and `pnpm lint` pass.
- [x] `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/plan.tsx`

## Suggested commit(s)
- `fix(web): guard out-of-order snap responses; cap waypoints at 25 client-side`
