# T8.1 — PWA manifest + install (vite-plugin-pwa)

> Make the web app installable: web manifest, icons, and vite-plugin-pwa registered.

| Field | Value |
|---|---|
| **Task ID** | T8.1 |
| **Milestone** | M8 — PWA & offline |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T7.1 |
| **Blocks** | T8.2 |
| **Labels** | frontend, pwa |

## Context & rationale
FR-8 requires an installable PWA. The `pwa` addon (vite-plugin-pwa) was scaffolded (PROJECT-SPEC.md §2); this
task ensures the manifest + icons are correct so the app installs on desktop/mobile.

## Spec references
- PRD FR-8, NFR-U1
- PROJECT-SPEC.md §2 (PWA addon), §5.5

## Implementation steps
1. Confirm/configure `vite-plugin-pwa` in `apps/web/vite.config.ts` (registerType, manifest).
2. Provide a web app manifest: name, short_name, theme/background colour, display `standalone`, and a full icon set.
3. Verify an install prompt appears and the app installs as standalone.
4. Confirm a production build emits the manifest + service worker.

## Acceptance criteria
- [ ] App is installable (manifest valid; icons present).
- [ ] Installs as a standalone window/app.
- [ ] Production build emits manifest + SW.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/vite.config.ts`, `apps/web/public/manifest.webmanifest`, `apps/web/public/icons/*`

## WOOLF report mapping
- *Technologies Used* (PWA) · *Requirement Gathering* (FR-8).

## References
- vite-plugin-pwa — https://vite-pwa-org.netlify.app/

## Suggested commit(s)
- `feat(pwa): web manifest + installable app`
