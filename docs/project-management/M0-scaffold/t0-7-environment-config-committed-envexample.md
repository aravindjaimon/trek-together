# T0.7 — Environment config + committed .env.example

> Centralise typed env loading and commit a .env.example mirroring every key — with no real secrets in the repo.

| Field | Value |
|---|---|
| **Task ID** | T0.7 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T0.1 |
| **Blocks** | T1.1, T0.5 |
| **Labels** | infra, security |

## Context & rationale
NFR-S3: no secrets in the repo, only `.env.example`. PROJECT-SPEC.md §10 lists the expected keys. A typed
env loader (validated with Zod) fails fast on misconfiguration and documents required config.

## Spec references
- PROJECT-SPEC.md §10 (env vars), §14 (don't commit secrets)
- PRD NFR-S3

## Implementation steps
1. Add `apps/server/src/lib/env.ts` validating env with Zod (`DATABASE_URL`, `CORS_ORIGIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PORT`, `ELEVATION_PROVIDER`, `OPENTOPODATA_BASE_URL`, `OPENTOPODATA_DATASET`, `OPEN_ELEVATION_BASE_URL`).
2. Add `apps/web` env (`VITE_SERVER_URL`).
3. Create a committed `.env.example` at repo root (and/or per app) mirroring all keys with placeholder values.
4. Confirm real `.env` files are git-ignored (scaffold `.gitignore` should cover them; extend if not). Also ignore `.DS_Store` (PROJECT-SPEC.md §12).
5. Default `ELEVATION_PROVIDER=opentopodata`, `OPENTOPODATA_DATASET=srtm30m` (PRD open question — proposed).

## Acceptance criteria
- [x] `.env.example` committed and complete; real `.env` files git-ignored. _(`apps/server/.env.example` + `apps/web/.env.example`; `git check-ignore` confirms real `.env` ignored, examples not.)_
- [x] Server refuses to boot on missing/invalid required env (clear error). _(Demoed: `BETTER_AUTH_SECRET=short` → "❌ Invalid environment variables" / refuses to boot.)_
- [x] `.DS_Store` is git-ignored. _(Already present in `.gitignore`.)_

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(Config only.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(Env loader fail-fast is import-time; verified manually rather than via Vitest. No new runtime logic.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Completion notes (2026-06-30)
- **Path reconciliation:** the typed loader lives in `packages/env/src/{server,web}.ts` (scaffold is
  package-based), not the task's intent path `apps/server/src/lib/env.ts`. Extended the **server** schema
  with `PORT` (coerced, default 3000) and optional elevation keys (`ELEVATION_PROVIDER`,
  `OPENTOPODATA_BASE_URL`, `OPENTOPODATA_DATASET`, `OPEN_ELEVATION_BASE_URL` — defaults baked in so they
  don't block boot before M1).
- **`.env.example` is per-app** (next to each real `.env`), not a single root file — clearer ownership of
  which keys belong to which app. The `DATABASE_URL` placeholder uses the replica-set form finalised in T0.3.

## Files & paths
- `apps/server/src/lib/env.ts`, `.env.example`, `.gitignore`

## WOOLF report mapping
- *Deployment Flow* — configuration surface.

## Suggested commit(s)
- `chore(config): typed env loader + .env.example; ignore .DS_Store`
