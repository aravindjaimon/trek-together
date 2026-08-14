# T10.3 — Explore fit-bounds after locate + drop home health toast

> "Near me" zooms to a lone point at z15, pushing the result pins off-screen; the home page
> double-signals server-down (toast + footer).

| Field | Value |
|---|---|
| **Task ID** | T10.3 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.25d |
| **Depends on** | — |
| **Blocks** | — |
| **Labels** | web, explore |

## Implementation steps
1. `explore.tsx`: after locate, once the recentered query resolves, fit bounds to the user location
   **plus** the result pins (not the single point).
2. `routes/index.tsx`: stop the health-check query from raising the global error toast (footer
   status stays as the single signal).

## Acceptance criteria
- [x] After "Near me", nearby route pins are visible without manual zoom-out.
- [x] Home with the server down shows the footer status only — no toast, no retry spam.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/explore.tsx`
- `apps/web/src/routes/index.tsx`

## Suggested commit(s)
- `fix(web): fit explore bounds to results after locate; single home health signal`
