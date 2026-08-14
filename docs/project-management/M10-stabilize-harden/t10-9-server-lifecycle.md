# T10.9 — Server lifecycle: graceful shutdown, real /health, index verify

> Restarts hard-kill in-flight requests, `/health` says ok with Mongo down, one stray rejection can
> take the process out, and a raw `prisma db push` silently drops the geo/TTL indexes.

| Field | Value |
|---|---|
| **Task ID** | T10.9 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T10.8 |
| **Blocks** | T12.1 |
| **Labels** | server, ops |

## Implementation steps
1. Capture `const server = app.listen(...)`; on SIGTERM/SIGINT: `server.close()` →
   `prisma.$disconnect()` → exit 0, with a 10s force-exit timer.
2. `process.on("unhandledRejection" | "uncaughtException")` → log with detail → exit 1.
3. `/health`: `prisma.$runCommandRaw({ ping: 1 })` with a 2s timeout → `{status:"ok",db:"ok"}` or
   503 `{status:"degraded",db:"down"}`. `GET /` stays pure liveness.
4. New `packages/db/src/verify-indexes.ts` (listIndexes; checks the 2dsphere + TTL indexes by name,
   mirroring `setup-indexes.ts`); call at startup — **warn loudly, don't crash**.

## Acceptance criteria
- [x] SIGTERM with an in-flight request: request completes, then clean exit.
- [x] Mongo stopped → `/health` 503 within ~2s; restored → 200.
- [x] Startup against a DB missing indexes logs an unmissable warning naming the fix (`pnpm db:push`).

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/server/src/index.ts`
- `packages/db/src/verify-indexes.ts` (new)

## Suggested commit(s)
- `feat(server): graceful shutdown, crash handlers, db-aware /health, index verify`
