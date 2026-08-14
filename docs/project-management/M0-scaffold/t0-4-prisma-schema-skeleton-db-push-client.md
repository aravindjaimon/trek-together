# T0.4 — Prisma schema skeleton + db push + client

> Establish the Prisma schema (provider = mongodb) and the generated client, synced with `db push` (never `migrate`).

| Field | Value |
|---|---|
| **Task ID** | T0.4 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.2, T0.3 |
| **Blocks** | T0.5, T1.4, T4.1 |
| **Labels** | database, prisma |

## Context & rationale
Prisma on MongoDB does **not** support `prisma migrate` — schema is synced with `prisma db push`
(PROJECT-SPEC.md §6 gotcha 1). Establish this workflow now so no one reaches for `migrate` later.

## Spec references
- PROJECT-SPEC.md §6 (db push only), §4 (`apps/server/prisma/schema.prisma`)
- PRD §11 (data model)

## Implementation steps
1. Open `apps/server/prisma/schema.prisma`; confirm `datasource db { provider = "mongodb" url = env("DATABASE_URL") }` and `generator client`.
2. Keep the Better-Auth-required models as scaffolded (`user`, `session`, `account`, `verification`) — do not hand-edit beyond what Better-Auth needs.
3. Run `pnpm db:push` (verify script name) → schema synced; then `prisma generate`.
4. Add a tiny smoke check (script or test) that instantiates `PrismaClient` and runs `db.runCommandRaw({ ping: 1 })`.
5. Record that **no `migrations/` folder** exists by design — note for the report.

## Acceptance criteria
- [x] `schema.prisma` uses `provider = "mongodb"`. _(`packages/db/prisma/schema/schema.prisma`.)_
- [x] `pnpm db:push` succeeds against the replica set; `prisma generate` produces the client. _(Indexes synced; `Generated Prisma Client (6.19.3)`.)_
- [x] A smoke check connects and pings the DB. _(`pnpm db:ping` → `MongoDB ping ok: {"ok":1}`.)_

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(Client + ping smoke live in the data package `@trek-together/db`.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(Ping is an integration smoke (`db:ping`), kept out of the infra-free unit suite by design; `pnpm test` still green.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [x] "db push, not migrate" decision noted for the report (T9.4). _(No `migrations/` folder by design; `db:migrate` must never run on Mongo — captured in CLAUDE.md and for T9.4.)_

## Completion notes (2026-06-30)
- **Path reconciliation:** schema is `packages/db/prisma/schema/{schema,auth}.prisma`; the client/data layer is
  `packages/db/src/index.ts` (not `apps/server/prisma/...` / `apps/server/src/lib/db.ts`).
- Added a reusable smoke: `packages/db/src/ping.ts` → `pnpm db:ping` (and `pnpm -F @trek-together/db db:ping`),
  which loads the server `.env`, instantiates the client, and runs `$runCommandRaw({ ping: 1 })`.

## Files & paths
- `apps/server/prisma/schema.prisma`, `apps/server/src/lib/db.ts`

## WOOLF report mapping
- *Database Schema Design* — Prisma-on-Mongo workflow & limitations.

## References
- Prisma MongoDB — https://www.prisma.io/docs/orm/overview/databases/mongodb

## Suggested commit(s)
- `feat(db): prisma mongodb schema skeleton + db push workflow`
