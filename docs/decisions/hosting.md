# Decision — Hosting target (Render + Vercel + MongoDB Atlas)

**Status:** accepted · **Date:** 2026-08-14 · **Supersedes:** the AWS targets in PROJECT-SPEC §11 /
PRD §12, the AWS ECS topology in `docs/diagrams/deployment.md`, the self-hosted Docker stack in
`docs/RUNBOOK.md`, and the "Vercel + MongoDB Atlas" note in commit `ddca14e`.

## Context

The hosting target had been recorded in four places that disagreed with each other, and none of it
was implemented:

| Source | Claimed target |
|---|---|
| `docs/PROJECT-SPEC.md` §11, `docs/PRD.md` §12 | AWS EC2 / Elastic Beanstalk + Atlas or DocumentDB |
| `docs/diagrams/deployment.md` (T9.5) | AWS: CloudFront + S3, ALB + ECS Fargate, Atlas |
| `docs/RUNBOOK.md` (M12) | Self-hosted Docker: server image + Mongo compose stack |
| commit `ddca14e` message | "Production runs on Vercel + MongoDB Atlas" |

The M12 artifacts the runbook documented — `apps/server/Dockerfile`, `docker-compose.prod.yml`,
`.dockerignore` — were never committed (`git log --all` finds no trace of them), despite T12.1 and
T12.2 being marked done. Nothing was ever hosted.

## Decision

| Component | Host | Why |
|---|---|---|
| `apps/server` | **Render** web service | Long-lived Node process |
| `apps/web` | **Vercel** | Static build; the app is a client-rendered SPA + service worker |
| Database | **MongoDB Atlas** (M0) | Managed replica set, credentialed and TLS by default |

## Why not serverless for the API

This is the load-bearing part of the decision. `apps/server` is not serverless-shaped, and deploying
it to Vercel Functions would break two limits **silently** — no error, just quota that stops being
enforced:

- **HTTP rate limiting** — `express-rate-limit` keeps its counters in process memory
  (`apps/server/src/index.ts`), as does Better-Auth's own limiter, which is explicitly commented as
  "one process" (`packages/auth/src/index.ts`). N concurrent instances means N× the intended limit.
- **The elevation circuit breaker** — the OpenTopoData guard is a *process-global* 1 req/s chain plus
  a daily counter. It exists to keep us inside a ~1000 calls/day per-IP quota
  (`docs/decisions/elevation-quota.md`). Spread across instances it stops protecting that quota, and
  the failure mode is a third-party ban rather than a local 429.

The server also assumes a supervisor: it drains in-flight requests on SIGTERM with a 10s cap, and
exits non-zero on unhandled rejections expecting a restart.

Render runs it as-is, with **no code changes**. Making it serverless-correct would mean moving both
limiters to shared storage (Redis) — real work, and infrastructure the project does not otherwise need.

## Why not AWS, as the spec originally targeted

ECS Fargate or EC2 would work and would look closer to the spec's diagram, but it is materially more
setup (VPC, subnets, security groups, ALB, target groups, task definitions, ECR) for a single
container with one health check. The capstone is graded on backend engineering depth, not on
infrastructure breadth, and the spec explicitly allows "document even if deployed minimally". The AWS
topology stays in `docs/diagrams/deployment.md` as the documented production-scale target; this ADR
records what is actually deployed.

## Consequences

- **No Dockerfile is needed.** Render builds from source with the repo's own build and start commands.
  The remaining `packages/db/docker-compose.yml` is local-dev only.
- **`BETTER_AUTH_URL` must be `https://`.** `packages/auth/src/index.ts` derives `secure: true` /
  `sameSite: "none"` from the URL scheme rather than from `NODE_ENV` — a deliberate fail-secure
  choice, but it means an `http://` value yields cookies a cross-origin browser rejects.
- **One web origin per deployment.** CORS `origin` and Better-Auth `trustedOrigins` are both a single
  `CORS_ORIGIN` string, so Vercel preview deployments are CORS-blocked. Accepted: widening it means
  an origin allowlist on a credentialed CORS surface, for previews nobody needs.
- **The web bundle is environment-specific.** `VITE_SERVER_URL` is baked at build time, so the API
  URL cannot be changed without rebuilding the web app.
- **Free-tier cold starts** — the API sleeps after 15 minutes idle (~30s first request). Acceptable
  for a capstone demo; the fix is a paid instance, not a code change.
- **Atlas replaces the Mongo hardening the runbook deferred.** Replica-set keyfile auth and TLS
  termination were listed as "not implemented"; both are now the provider's responsibility.
- **Backups** are Atlas snapshots, not `mongodump` from a Docker named volume.
