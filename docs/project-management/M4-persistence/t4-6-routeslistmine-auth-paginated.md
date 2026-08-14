# T4.6 — routes.listMine (auth, paginated)

> List the authenticated user's own routes with pagination and a capped limit.

| Field | Value |
|---|---|
| **Task ID** | T4.6 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done (behavior in T4.8) |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T4.3 |
| **Blocks** | T4.7, T7.6 |
| **Labels** | api, auth |

## Context & rationale
FR-5 requires users to manage their routes. List is owner-scoped, paginated, and capped (PROJECT-SPEC.md §7,
PRD §12).

## Spec references
- PRD FR-5, §12 (`routes.listMine`, auth, paginated)
- PROJECT-SPEC.md §7

## Implementation steps
1. Create `apps/server/src/routers/routes/list-mine.ts` (auth required).
2. Zod input: `page`, `limit` (default + max cap).
3. Call `routes.repo.listByOwner({ ownerId: session.user.id, page, limit })`.
4. Return items + pagination meta (total/page/limit or next-cursor).
5. Order by `updatedAt` desc by default.

## Acceptance criteria
- [ ] Returns only the caller's routes; pagination works; limit is capped.
- [ ] Unauthenticated calls rejected.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/list-mine.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-5).

## Suggested commit(s)
- `feat(routes): routes.listMine (auth, paginated)`
