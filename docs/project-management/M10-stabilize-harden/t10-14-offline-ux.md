# T10.14 — Offline banner + offline-aware empty states

> Offline, Explore/My Routes surface as misleading empty states with no signal that the network is
> the problem — despite the manifest advertising "offline-ready".

| Field | Value |
|---|---|
| **Task ID** | T10.14 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T10.12 |
| **Blocks** | — |
| **Labels** | web, pwa |

## Implementation steps
1. `useOnline()` hook (`useSyncExternalStore` on `online`/`offline` events) in `apps/web/src/lib/`.
2. Slim banner in `__root.tsx`: "You're offline — showing saved data."
3. Explore/My Routes error/empty states branch on offline ("You're offline" + what still works).
4. Verify `registerType: "autoUpdate"` behavior against the production build; correct any
   over-claiming copy.

## Acceptance criteria
- [x] DevTools offline: banner appears; Explore/My Routes explain offline instead of "no routes".
- [x] Previously viewed route still renders fully offline (regression check on M8 behavior).

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/lib/use-online.ts` (new) · `apps/web/src/routes/{__root,explore,routes}.tsx`

## Suggested commit(s)
- `feat(web): offline indicator + offline-aware list states`
