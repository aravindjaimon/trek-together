# T11.4 — `logs.create` + `logs.listForRoute` procedures

| Field | Value |
|---|---|
| **Task ID** | T11.4 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T11.3 |
| **Blocks** | T11.5, T11.6, T11.7 |
| **Labels** | api |

## Implementation steps
1. `packages/api/src/routers/logs/{index,create,list-for-route,log.schema}.ts`; register `logs` in
   `routers/index.ts`.
2. Thin procedures: Zod → authz gate → repo.
   - `logs.create` (`protectedProcedure`): require the route visible via `findVisibleRoute`
     (uniform NOT_FOUND); author `userId`/`userName` from `context.session`, never the client.
   - `logs.listForRoute` (`publicProcedure`): require the route visible; return
     `{ items, total, stats }`.
3. Zod (`log.schema.ts`): `rating` int 1–5 · `completedOn` not future · `0 < actualDurationS ≤ 7 days`
   · `notes` ≤ 2000 · `routeId` ObjectId · list `limit` ≤ 50.

## Acceptance criteria
- [x] `logs.create` on an invisible route → NOT_FOUND; unauthenticated → UNAUTHORIZED.
- [x] `logs.listForRoute` works anonymously for a public route; hidden for a private one to non-owners.
- [x] Invalid input (future date, rating 0/6, over-long notes) → typed BAD_REQUEST.

## Definition of Done
- [x] Procedures thin; math/authz not inlined (CLAUDE.md §3).
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/routers/logs/*` (new) · `packages/api/src/routers/index.ts`

## Suggested commit(s)
- `feat(logs): logs.create + logs.listForRoute procedures`
