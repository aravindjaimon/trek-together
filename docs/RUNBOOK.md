# Trek Together — Operations Runbook

How to deploy and operate Trek Together. Hosting is **Render** (API) + **Vercel** (web) +
**MongoDB Atlas** (database) — see [`decisions/hosting.md`](./decisions/hosting.md) for why, including
why the API is not serverless.

## Stack

- **Server** — Express 5 + oRPC, bundled by tsdown to a single `apps/server/dist/index.mjs`, Node 24.
  Runs as a long-lived process; no container image.
- **Web** — Vite build (`apps/web/dist`), a client-rendered SPA + service worker, served as static
  files. `VITE_SERVER_URL` is baked in **at build time**, so the bundle is environment-specific.
- **Database** — MongoDB Atlas. Prisma's Mongo connector needs a replica set for the transactions
  Better-Auth uses; Atlas is one by default, so the local `replicaSet=rs0&directConnection=true`
  parameters do **not** carry over.
- **Elevation / routing / geocoding** — third-party HTTP APIs (OpenTopoData, Open-Elevation, Mapbox,
  Nominatim), reached through the cache. No infrastructure of ours.

## Environment (`@trek-together/env/server`, Zod-validated — the server fails fast on invalid env)

| Key | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Atlas SRV string, e.g. `mongodb+srv://<user>:<pass>@<cluster>/trek-together?retryWrites=true&w=majority` |
| `BETTER_AUTH_SECRET` | ✅ | — | ≥32 chars; `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | — | Public API URL. **Must be `https://`** — cookie `Secure`/`SameSite=None` is derived from the scheme, not from `NODE_ENV` (fail-secure) |
| `CORS_ORIGIN` | ✅ | — | The web app's origin, a **single** origin. Credentials are allowed only from it |
| `PORT` | — | `3000` | Render injects this |
| `NODE_ENV` | — | `development` | Set `production`: enables `trust proxy` for real client IPs, and downgrades the port-shadow self-check from `exit(1)` to a warning |
| `OPENTOPODATA_DAILY_LIMIT` | — | `1000` | Local daily circuit breaker matching the public host's quota |
| `OPENTOPODATA_BASE_URL` / `OPENTOPODATA_DATASET` | — | public host / `srtm30m` | Point at a self-hosted OpenTopoData to lift the quota |
| `OPEN_ELEVATION_BASE_URL` | — | public host | Fallback provider |
| `MAPBOX_ACCESS_TOKEN` | — | — | Trail snapping; **unset ⇒ snapping falls back to straight lines** |
| `ELEVATION_PROVIDER` / `ROUTING_PROVIDER` | — | `opentopodata` / `mapbox` | — |
| `GEOCODING_PROVIDER` / `NOMINATIM_BASE_URL` | — | `nominatim` / public host | Place search |

Web build needs exactly one: `VITE_SERVER_URL` (the API origin).

Escape hatch: `SKIP_ENV_VALIDATION=1` — used by CI, never in production. Production secrets live in
the Render and Vercel dashboards; the repo carries no env files (the envx `.gpg` blobs were removed
when the repo was made public).

## Boot order (critical)

1. **Atlas reachable** — cluster running, database user created, and the IP allowlist covers the API.
   Render's free tier has no static egress IP, so this is `0.0.0.0/0`.
2. **Indexes** — run **`pnpm db:push`**, never a bare `prisma db push`. Two indexes Prisma can't
   express are created out-of-band by `packages/db/src/setup-indexes.ts`, which the `db:push` script
   chains: the `elevationCache` TTL index and the `routes.path` 2dsphere index. A raw
   `prisma db push` **silently drops them** → the elevation cache stops expiring and `routes.explore`
   `$geoNear` fails. The server logs a loud `[startup] MISSING INDEX …` warning at boot if they're
   absent (it warns, it does not crash).
3. **Server** — `node apps/server/dist/index.mjs`.

## Deploy

### 1. MongoDB Atlas

Create a free **M0** cluster in a region near the Render region. Add a database user, and allow
`0.0.0.0/0` under Network Access. Then, from a local checkout, create the schema and both
out-of-band indexes:

```bash
DATABASE_URL='mongodb+srv://…/trek-together?retryWrites=true&w=majority' pnpm db:push
```

The override works because `packages/db/prisma.config.ts` and `setup-indexes.ts` both call
`dotenv.config()` without `override`, so a real `process.env.DATABASE_URL` wins over `.env.local`.

### 2. API on Render

A Web Service from the repo, branch `main`:

| Setting | Value |
|---|---|
| Build Command | `pnpm install --frozen-lockfile && pnpm turbo build -F server` |
| Start Command | `pnpm --filter server start` |
| Health Check Path | `/health` |
| Node version | from `.nvmrc` (24.17.0) |

Set every required env var above. Prisma's Linux query engine is produced by the
`postinstall: "prisma generate"` in `packages/db/package.json`, which the install step runs — no
`binaryTargets` entry is needed.

### 3. Web on Vercel

`vercel.json` at the repo root already pins the build (`pnpm turbo build -F web` →
`apps/web/dist`) and the SPA rewrite that makes TanStack Router deep links resolve. The only
dashboard setting is the env var `VITE_SERVER_URL` = the Render URL.

### 4. Close the origin loop

There is an ordering dependency: the web build needs the API URL, and the API needs the web origin.
So deploy Render first, then Vercel, then set Render's `CORS_ORIGIN` to the Vercel domain and
redeploy. Preview deployments get their own URLs and will be CORS-blocked — expected, see the ADR.

## Health & readiness

- `GET /` → `200 OK` — **liveness** (process up).
- `GET /health` → `{status:"ok",db:"ok"}` (200) or `{status:"degraded",db:"down"}` (503) —
  **readiness**; pings Mongo with a 2s timeout. This is Render's health check path. A persistent
  `degraded` almost always means the Atlas IP allowlist or the `DATABASE_URL` credentials.
- `GET /api-reference` — the Scalar UI over the generated OpenAPI document.

## Limits & abuse protection

- **Per-IP HTTP rate limit** — 300 requests / 15 min across `/api/auth/*` and `/rpc` (helmet sets
  security headers; oRPC body cap is 1 MiB). Better-Auth adds stricter per-path sign-in throttling.
  Both are **in-memory**: they assume a single instance, and scaling horizontally multiplies the
  effective limit.
- **Elevation quota (known limit)** — the public OpenTopoData host allows ~1 req/s and **~1000
  calls/day per IP**: roughly 100–200 *cold* route analyses/day across all users. The server enforces
  this locally (process-global 1 req/s chain, 429 retry-once, daily circuit breaker); at the ceiling
  cold analyses degrade to a typed `ELEVATION_UNAVAILABLE` until the UTC day rolls over. Warm (cached)
  analyses are unaffected. To lift it: self-host OpenTopoData (`OPENTOPODATA_BASE_URL`) or raise
  `OPENTOPODATA_DAILY_LIMIT`. See [`decisions/elevation-quota.md`](./decisions/elevation-quota.md).
- **Free-tier sleep** — the Render service sleeps after 15 minutes idle; the next request takes ~30s.

## Graceful shutdown

`SIGTERM`/`SIGINT` → stop accepting, drain in-flight requests (`server.close`), `prisma.$disconnect`,
exit 0, with a 10 s force-exit cap. Render sends SIGTERM on redeploy, so deploys drain cleanly.
Unhandled rejections / uncaught exceptions log and exit 1 for the platform to restart.

## Backups

Atlas M0 does not include scheduled backups. For a point-in-time copy, `mongodump` against the SRV
string:

```bash
mongodump --uri "$DATABASE_URL" --archive > backup-$(date +%F).archive
mongorestore --uri "$DATABASE_URL" --archive < backup-2026-08-14.archive
```

Paid Atlas tiers provide continuous snapshots and restore from the dashboard.

## Observability

The server emits one JSON access-log line per request
(`{ts,requestId,method,path,status,ms}`) to stdout, plus the `x-request-id` response header, so a
client-reported error correlates to exactly one log line. Render captures stdout and retains it for
the plan's window. There are **no metrics and no tracing** — if you need either, that is new work,
not configuration.

## CI

`.github/workflows/ci.yml` runs on push/PR to `development`/`main`: `pnpm install --frozen-lockfile`
→ `lint` → `check-types` → `test` → `build`. No Mongo service — the test suites are DB-free; the
benchmark scripts (`apps/server/scripts/`) need a live DB and are excluded from `pnpm test`.
