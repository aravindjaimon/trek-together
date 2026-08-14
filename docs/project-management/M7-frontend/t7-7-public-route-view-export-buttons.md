# T7.7 — Public route view + export buttons

> A shareable, no-login route page (map + profile + difficulty + time) with GPX/JSON export buttons.

| Field | Value |
|---|---|
| **Task ID** | T7.7 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | T4.5, T5.4 |
| **Blocks** | T8.3 |
| **Labels** | frontend, sharing, export |

## Context & rationale
FR-6/FR-8 viewer experience: open a shared link and see everything, then export for offline use — no
account (PRD §5 Viewer, §6). Consumes `routes.getById` + `routes.exportItinerary`.

## Spec references
- PRD FR-6, FR-8, §6 (Viewer stories)
- PROJECT-SPEC.md §7

## Implementation steps
1. Add a `/r/:id` route that loads `routes.getById` (works anonymously for public routes).
2. Render the map, elevation profile, difficulty badge, and time/metric summary (reuse T7.4/T7.5).
3. Add 'Export GPX' / 'Export JSON' buttons calling `routes.exportItinerary` and triggering a download.
4. Handle private/unknown ids with a friendly not-found state.
5. Add a 'Copy share link' affordance on owned routes.

## Acceptance criteria
- [ ] A public route opens with no login and shows the full analysis.
- [ ] GPX/JSON export buttons download valid files.
- [ ] Private/unknown ids show a not-found state.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/routes/r.$id.tsx`, `apps/web/src/components/ExportButtons.tsx`

## WOOLF report mapping
- *Requirement Gathering* (FR-6/FR-8, Viewer).

## Suggested commit(s)
- `feat(web): public route view + gpx/json export`
