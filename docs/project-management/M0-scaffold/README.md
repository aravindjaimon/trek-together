# M0 — Scaffold

> Stand up the Better-T-Stack monorepo so all later work has a correct, reproducible foundation.

## Why this milestone

This milestone turns a greenfield repo (just `PRD.md`, `PROJECT-SPEC.md`, the report template) into the
agreed MERN-family monorepo. The stack is fixed by PROJECT-SPEC.md §2's exact scaffold command; deviating
from it would invalidate later design decisions. Getting the replica set, Prisma `db push` workflow,
auth, and the Express+oRPC shell right here removes the most common sources of friction downstream.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T0.1](./t0-1-generate-the-better-t-stack-scaffold.md) | Generate the Better-T-Stack scaffold | P0 | 0.5d | — |
| [T0.2](./t0-2-install-dependencies-pin-the-toolchain.md) | Install dependencies & pin the toolchain | P0 | 0.5d | T0.1 |
| [T0.3](./t0-3-provision-mongodb-docker-single-node-replica-set.md) | Provision MongoDB (Docker single-node replica set) | P0 | 0.5d | T0.1 |
| [T0.4](./t0-4-prisma-schema-skeleton-db-push-client.md) | Prisma schema skeleton + db push + client | P0 | 0.5d | T0.2, T0.3 |
| [T0.5](./t0-5-wire-better-auth-email-password-sessions.md) | Wire Better-Auth (email/password + sessions) | P0 | 1d | T0.4 |
| [T0.6](./t0-6-express-orpc-base-context-handler-health.md) | Express + oRPC base (context, handler, health) | P0 | 1d | T0.2 |
| [T0.7](./t0-7-environment-config-committed-envexample.md) | Environment config + committed .env.example | P1 | 0.5d | T0.1 |
| [T0.8](./t0-8-baseline-commit-reconcile-claudemd-4-8-green-hooks.md) | Baseline commit, reconcile PROJECT-SPEC.md §4/§8, green hooks | P1 | 0.5d | T0.1–T0.7 |

## Entry criteria (what must be true before starting)

- Empty/greenfield repo with `PRD.md`, `PROJECT-SPEC.md`, and the WOOLF `.docx` present.
- Docker, Node 24.17.0, and pnpm 11.8.0 available locally.

## Exit criteria (milestone is done when…)

- `pnpm dev` boots web + server; `/health` responds; Mongo replica set is up.
- Register/login/logout works; sessions persist.
- `.env.example` committed (no secrets); PROJECT-SPEC.md §4/§8 reconciled; Husky green.
- Public GitHub repo created with scaffold + M0 commits.

## WOOLF report artifacts produced here

- *Technologies Used* — concrete stack fixed by the scaffold.
- *Deployment Flow* / *Database Schema Design* — local replica-set + `db push` rationale.
