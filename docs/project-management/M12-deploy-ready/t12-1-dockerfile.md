# T12.1 — Dockerfile + .dockerignore (multi-stage server image)

| Field | Value |
|---|---|
| **Task ID** | T12.1 |
| **Milestone** | M12 — Deploy-Ready |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T10.5, T10.9 |
| **Blocks** | T12.2, T12.3 |
| **Labels** | infra, docker |

## Context & rationale
The tsdown server bundle inlines every `@trek-together/*` package (incl. the generated Prisma client)
but leaves npm deps external, so the runtime image still needs `node_modules`. Installing inside a
linux builder makes `prisma generate` emit the linux query engine automatically (no `binaryTargets`
pinning). `pnpm deploy` fights the bundled-Prisma layout (non-injected workspace + build-script
approval), so the lazy-correct choice is to carry the built workspace `node_modules` into the runner.

## Implementation steps
1. `.dockerignore` — strip `node_modules`, `dist`, `.turbo`, `prisma/generated`, `.git`, docs, envs;
   keep `*.prisma`.
2. `apps/server/Dockerfile` — multi-stage `node:24-slim`:
   - builder: `apt-get install openssl ca-certificates` (Prisma engine detection + outbound HTTPS),
     `corepack enable`, `pnpm install --frozen-lockfile` (postinstall generates the linux engine),
     `pnpm -F server build`.
   - runner: openssl/ca-certificates, `COPY --from=builder /app /app`, `CMD node apps/server/dist/index.mjs`.
   - Build context is the repo root: `docker build -f apps/server/Dockerfile -t trek-together-server .`

## Acceptance criteria
- [x] `docker build` succeeds; the linux Prisma engine is generated (no openssl warning at runtime).
- [x] `docker run` against a reachable Mongo → `/health` returns `{status:"ok",db:"ok"}`.
- [x] A real DB query (`routes.explore` `$geoNear`) returns data from the container.
- [x] SIGTERM (`docker stop`) drains gracefully (`[shutdown] SIGTERM received`).

## Definition of Done
- [x] Verified end-to-end against the host Mongo.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/server/Dockerfile` (new) · `.dockerignore` (new)

## Suggested commit(s)
- `feat(deploy): multi-stage server Dockerfile + .dockerignore`
