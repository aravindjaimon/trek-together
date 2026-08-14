# T5.1 — Public share-by-link view (anonymous getById)

> Confirm a public route is fully consumable by an anonymous caller via a stable id link, with private routes hidden.

| Field | Value |
|---|---|
| **Task ID** | T5.1 |
| **Milestone** | M5 — Share + export |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T4.5 |
| **Blocks** | T5.5, T7.7 |
| **Labels** | api, sharing |

## Context & rationale
FR-6 + Assumption A3: a share link is just a public route reachable by its id, no token/expiry. The
server piece is mostly T4.5; this task hardens and verifies the *anonymous viewer* path end-to-end and
defines the shareable payload the viewer page (T7.7) consumes.

## Spec references
- PRD FR-6, §5 (Viewer actor), §12, A3
- PROJECT-SPEC.md §7

## Implementation steps
1. Confirm `routes.getById` returns the complete viewer payload for an anonymous caller when `isPublic`.
2. Define the stable share URL shape the web app will use (e.g. `/r/:id`) and document it.
3. Ensure private/non-existent ids return NOT_FOUND (no existence leak).
4. Add response fields needed for nice previews if cheap (name, difficulty, distance) — note the optional thumbnail (PRD open question) as future work.

## Acceptance criteria
- [ ] Anonymous GET of a public route returns map + profile + metrics + time + difficulty.
- [ ] Private/unknown ids → NOT_FOUND.
- [ ] Share URL shape documented for the frontend.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/get-by-id.ts` (verify), `docs/decisions/sharing.md`

## WOOLF report mapping
- *Requirement Gathering* (FR-6, Viewer) · *Feature Development Process*.

## Suggested commit(s)
- `feat(routes): public share-by-link viewer payload`
