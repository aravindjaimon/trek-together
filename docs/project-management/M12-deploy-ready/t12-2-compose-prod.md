# T12.2 — docker-compose.prod.yml

| Field | Value |
|---|---|
| **Task ID** | T12.2 |
| **Milestone** | M12 — Deploy-Ready |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.25d |
| **Depends on** | T12.1 |
| **Blocks** | T12.4 |
| **Labels** | infra, docker |

## Implementation steps
1. `docker-compose.prod.yml` at the repo root: the server image (built from `apps/server/Dockerfile`)
   + `mongo:8.2` single-node replica set (reuse the dev healthcheck self-init trick), `env_file`,
   `depends_on` the healthy Mongo, restart policy.
2. Mongo keyfile auth is a **runbook note**, not implemented (matches CLAUDE.md: keyfile auth is the
   production path, out of scope for the local/demo compose).

## Acceptance criteria
- [x] `docker compose -f docker-compose.prod.yml up` brings up Mongo (replica set) then the server.
- [x] `/health` returns db-ok once both are healthy.

## Definition of Done
- [x] Verified from a fresh volume.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `docker-compose.prod.yml` (new)

## Suggested commit(s)
- `feat(deploy): production docker-compose (server + mongo replica set)`
