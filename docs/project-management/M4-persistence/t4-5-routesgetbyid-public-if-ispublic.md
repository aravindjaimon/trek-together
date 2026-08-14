# T4.5 — routes.getById (public if isPublic)

> Fetch a route by id: public routes visible to anyone; private routes only to their owner.

| Field | Value |
|---|---|
| **Task ID** | T4.5 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done (behavior in T4.8) |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T4.3 |
| **Blocks** | T4.7, T5.1, T7.7 |
| **Labels** | api, auth |

## Context & rationale
FR-6 + the share-by-link model (Assumption A3): a public route is reachable by id with no auth; a
private route must not be exposed to others (PRD §12, NFR-S2).

## Spec references
- PRD FR-6, §12 (`routes.getById`, public if isPublic), NFR-S2, A3
- PROJECT-SPEC.md §7

## Implementation steps
1. Create `apps/server/src/routers/routes/get-by-id.ts` (auth **optional**).
2. Load via `routes.repo.findById`; if `isPublic` return it; if private, return it only when the session user is the owner; otherwise NOT_FOUND (don't reveal existence).
3. Return the full view payload (geometry, profile, metrics, time, difficulty).
4. Keep visibility logic in the procedure/service, not the client.

## Acceptance criteria
- [ ] Anonymous caller can read a public route.
- [ ] Private route is hidden from non-owners (NOT_FOUND), visible to its owner.
- [ ] Response carries everything the viewer page needs.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/get-by-id.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-6) · *Feature Development Process*.

## Suggested commit(s)
- `feat(routes): routes.getById with public/private visibility`
