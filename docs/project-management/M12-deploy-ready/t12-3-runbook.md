# T12.3 — docs/RUNBOOK.md

| Field | Value |
|---|---|
| **Task ID** | T12.3 |
| **Milestone** | M12 — Deploy-Ready |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T12.1 |
| **Blocks** | T12.4 |
| **Labels** | docs, ops |

## Implementation steps
`docs/RUNBOOK.md` covering:
1. **Env table** — every `@trek-together/env/server` key incl. `OPENTOPODATA_DAILY_LIMIT` and the
   optional `MAPBOX_ACCESS_TOKEN`; note fail-fast validation.
2. **Boot order** — mongo healthy → `pnpm db:push` (**never** raw `prisma db push`; it drops the
   TTL/2dsphere indexes the pnpm script re-applies) → server.
3. **Health/readiness** — `GET /` liveness; `GET /health` pings Mongo (503 when down).
4. **Rate-limit / quota ceilings** — per-IP 300/15min; elevation ~1000/day (documented known limit).
5. **Graceful shutdown** — SIGTERM drains + disconnects (10s cap).
6. **Backup** — `mongodump` of the named volume.
7. **CI** — what `.github/workflows/ci.yml` runs.

## Acceptance criteria
- [x] A reader can boot the stack from scratch following the runbook verbatim.
- [x] The "never raw prisma db push" index footgun is called out.

## Definition of Done
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `docs/RUNBOOK.md` (new)

## Suggested commit(s)
- `docs(ops): production runbook (env, boot order, health, backup)`
