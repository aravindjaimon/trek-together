# T8.2 — Service worker app-shell precache

> Precache the app shell (HTML/JS/CSS) so the planner UI loads with no network.

| Field | Value |
|---|---|
| **Task ID** | T8.2 |
| **Milestone** | M8 — PWA & offline |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T8.1 |
| **Blocks** | T8.3, T8.4 |
| **Labels** | frontend, pwa, offline |

## Context & rationale
NFR-U1: the service worker should cache the app shell so the UI opens offline (PRD §5.5). This is the
base layer before caching dynamic itineraries (T8.3).

## Spec references
- PRD NFR-U1, §5.5
- PROJECT-SPEC.md §5.5

## Implementation steps
1. Configure Workbox (via vite-plugin-pwa) precache for the built shell assets.
2. Choose an update strategy (e.g. prompt or auto-update) and handle SW updates gracefully.
3. Verify offline: load the app, go offline, reload → shell still loads.
4. Avoid caching API responses here (that's T8.3, with its own strategy).

## Acceptance criteria
- [ ] App shell loads offline after first visit.
- [ ] SW update flow works without trapping users on a stale build.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/vite.config.ts` (Workbox config), SW registration

## WOOLF report mapping
- *Technologies Used* (PWA/offline).

## References
- Workbox — https://developer.chrome.com/docs/workbox/

## Suggested commit(s)
- `feat(pwa): precache app shell for offline`
