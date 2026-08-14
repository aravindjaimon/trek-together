# T0.6 — Express + oRPC base (context, handler, health)

> Stand up the Express app with the oRPC handler mounted, a typed context, CORS, and a health endpoint.

| Field | Value |
|---|---|
| **Task ID** | T0.6 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T0.2 |
| **Blocks** | T1.1, T3.1, T3.4 |
| **Labels** | api, server |

## Context & rationale
oRPC procedures are the API surface (PROJECT-SPEC.md §3/§7). This task creates the HTTP shell they mount on:
Express app, oRPC handler, the request→context bridge (incl. the session from T0.5), CORS, and a
`/health` route to prove the server boots. Keep procedures thin from day one.

## Spec references
- PROJECT-SPEC.md §3 (layering), §7 (oRPC on Express)
- PRD §12

## Implementation steps
1. In `apps/server/src/index.ts`: create the Express app, JSON middleware, CORS (credentials, `CORS_ORIGIN`).
2. Mount the oRPC handler at its base path; create `apps/server/src/lib/context.ts` (db client + session + request id).
3. Add a `routers/` root router that composes domain routers (`routes`, `logs` later); start with a trivial `health` procedure or plain `GET /health`.
4. Add the request-logging + a placeholder for centralized error handling (fully done in T3.4).
5. `pnpm dev:server` boots; hit `/health` → 200.

## Acceptance criteria
- [x] Server boots via `pnpm dev:server`; `/health` returns 200. _(Booted on `env.PORT`; `GET /health` → 200 `{"status":"ok"}`.)_
- [x] oRPC handler is mounted and reachable; an example/health procedure responds. _(`POST /rpc/healthCheck` → 200 `{"json":"OK"}`.)_
- [x] Context provides `{ db, session, requestId }` to procedures. _(`packages/api/src/context.ts` returns `{ db: prisma, session, requestId: randomUUID() }`; procedure executed through it.)_

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(Procedure stays thin; `db` access via the data-layer `prisma` client.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(HTTP shell verified live via curl; no pure logic added to unit-test. Procedure smoke deferred to M1+ services.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Completion notes (2026-06-30)
- **Path reconciliation:** context is `packages/api/src/context.ts` and routers
  `packages/api/src/routers/index.ts` (package-based scaffold), not `apps/server/src/lib/*`.
- `apps/server/src/index.ts` now reads `env.PORT` (no longer hard-coded 3000) and adds `GET /health`.
- Context dropped the unused `auth: null` and now exposes `{ db: prisma, session, requestId }`. `db` is the
  shared `@trek-together/db` client; Better-Auth keeps its own internal client (unifying is a later cleanup).
- Centralised error handling + request logging remain stubs (full treatment is T3.4).

## Files & paths
- `apps/server/src/index.ts`, `apps/server/src/lib/context.ts`, `apps/server/src/routers/index.ts`

## WOOLF report mapping
- *Class Diagrams (LLD)* — the router/context backbone.

## References
- oRPC — https://orpc.unnoq.com/

## Suggested commit(s)
- `feat(server): express + orpc base with context and health check`
