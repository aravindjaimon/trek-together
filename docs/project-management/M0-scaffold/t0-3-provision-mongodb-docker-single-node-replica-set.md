# T0.3 — Provision MongoDB (Docker single-node replica set)

> Run local MongoDB as a single-node replica set (required by Prisma) via the scaffold's Docker setup.

| Field | Value |
|---|---|
| **Task ID** | T0.3 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.1 |
| **Blocks** | T0.4, T1.4, T4.1 |
| **Labels** | infra, database |

## Context & rationale
Prisma's MongoDB connector needs a **replica set** for transactions (PROJECT-SPEC.md §6 gotcha 3,
PRD NFR-R2). `--db-setup docker` provisions a single-node replica set for local dev. Getting this
right early prevents confusing Prisma errors later.

## Spec references
- PROJECT-SPEC.md §6 (replica set required), §8 (db commands)
- PRD NFR-R2

## Implementation steps
1. Locate the generated `apps/server/docker-compose.yml`; confirm it starts mongo with
   `--replSet rs0` (or similar) and initiates the set.
2. Start it via the generated script (name may be `db:start` / `db:up` — verify): `pnpm db:start`.
3. Confirm the replica set is initiated: `docker exec -it <mongo> mongosh --eval "rs.status().ok"` → `1`.
4. Confirm the connection string includes `?replicaSet=rs0` (matches `DATABASE_URL` in T0.7).
5. Document the start/stop commands for the README (T9.1) and reconcile names in T0.8.

## Acceptance criteria
- [x] `pnpm db:start` brings up MongoDB; `rs.status().ok === 1`. _(Verified: healthcheck self-initiates `rs0`; `rs.status().ok` → `1`, member `localhost:27017` PRIMARY.)_
- [x] A client can connect with `?replicaSet=rs0`. _(Prisma `db push` connected via `mongodb://localhost:27017/trek-together?replicaSet=rs0&directConnection=true` and synced indexes.)_
- [x] Data persists across container restarts (named volume). _(Inserted a marker doc → `docker compose down` (no `-v`) → `pnpm db:start` → marker + `rs.ok` survived.)_

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(Infra only.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(No code logic — Docker config; verified by live `rs.status`/persistence checks.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [x] Start/stop commands captured for README (T9.1). _(Documented here; full README is T9.1: `pnpm db:start` / `db:stop` / `db:down`.)_

## Completion notes (2026-06-30)
- **Path reconciliation:** the compose file is `packages/db/docker-compose.yml` (not `apps/server/...`).
- Single-node replica set via `command: ["--replSet","rs0","--bind_ip_all"]`. **Local auth dropped**
  (`MONGO_INITDB_ROOT_*` removed) — replica-set internal auth needs a keyfile, overkill for local dev and
  matches SPEC §10's auth-less `DATABASE_URL`. Keyfile auth is the production path.
- **Self-initiating healthcheck**: first probe sees `rs.status()` throw → runs `rs.initiate(...)` and
  reports unhealthy; the next probe sees `rs.status().ok === 1` → healthy. No separate init container.
- `DATABASE_URL` (in the git-ignored `apps/server/.env`) updated to
  `mongodb://localhost:27017/trek-together?replicaSet=rs0&directConnection=true`; committed
  `apps/server/.env.example` already documents this form (T0.7).

## Files & paths
- `apps/server/docker-compose.yml`

## WOOLF report mapping
- *Deployment Flow* / *Database Schema Design* — local replica-set rationale (Prisma-on-Mongo).

## References
- Prisma + MongoDB replica set — https://www.prisma.io/docs/orm/overview/databases/mongodb

## Suggested commit(s)
- `chore: configure dockerised mongodb replica set for local dev`
