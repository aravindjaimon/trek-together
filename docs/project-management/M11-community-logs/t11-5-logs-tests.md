# T11.5 — Logs integration tests

| Field | Value |
|---|---|
| **Task ID** | T11.5 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T11.4 |
| **Blocks** | — |
| **Labels** | api, tests |

## Implementation steps
1. `packages/api/src/routers/logs/logs.test.ts`, mirroring `persistence.test.ts` — DB-free via
   in-memory repo mocks (logs repo + routes repo), ephemeral `node:http` + oRPC client.
2. Cover: create requires auth; create on invisible route → NOT_FOUND; list a public route
   anonymously → ok; list a private route as owner → ok, as stranger → NOT_FOUND; pagination
   (cap/limit); stats math (count / avgRating / avgActualDurationS); Zod rejections.

## Acceptance criteria
- [x] Authz matrix (auth/visible/owner) fully asserted with typed codes.
- [x] Stats assertions verify the aggregation numbers.
- [x] Suite is offline (no Mongo/network) and part of `pnpm test`.

## Definition of Done
- [x] `pnpm test` green (new suite included).
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/routers/logs/logs.test.ts` (new)

## Suggested commit(s)
- `test(logs): authz matrix + stats aggregation over HTTP`
