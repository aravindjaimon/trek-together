# Trek Together

Plot a trail on a map and get a trustworthy analysis of it: an elevation profile, total
ascent/descent, an estimated walking time, and a difficulty grade — all computed from real elevation
data. Routes can be saved, shared by link, exported as GPX/JSON for offline use, discovered by other
hikers via a "routes near me" map search, and logged after you walk them.

Capstone project — Scaler Neovarsity / Woolf, MSc Computer Science (Backend Specialization).

| | |
|---|---|
| **Web** | _set after first deploy_ |
| **API** | _set after first deploy_ |
| **API reference** | `<api-url>/api-reference` (Scalar, generated from the oRPC router) |

## What it demonstrates

The app is deliberately small and focused on backend depth rather than feature count:

- **Geospatial backend** — GeoJSON route geometry in MongoDB with a `2dsphere` index and `$geoNear`
  proximity queries.
- **Typed end-to-end API** — oRPC procedures with Zod validation shared between server and client.
- **A measured optimization** — caching expensive, rate-limited elevation lookups, benchmarked cold
  vs. warm (`docs/benchmarks/`).

## Stack

| Layer | Choice |
|---|---|
| Web | React 19 + Vite, TanStack Router/Query, Tailwind, installable PWA with offline support |
| API | Express 5 + oRPC, Zod-validated env, OpenAPI/Scalar reference |
| Auth | Better-Auth (email/password), Prisma adapter |
| Database | MongoDB (replica set — Prisma's Mongo connector needs one for transactions) |
| Third-party | OpenTopoData / Open-Elevation (elevation), Mapbox (trail snapping), Nominatim (geocoding) |
| Tooling | pnpm workspaces + Turborepo, Biome, Vitest, TypeScript |

```
apps/web       React PWA            packages/api    oRPC routers + integrations
apps/server    Express + oRPC       packages/auth   Better-Auth config
                                    packages/db     Prisma schema, client, index setup
                                    packages/env    Zod env schemas (server + web)
                                    packages/ui     shared components
```

## Local development

Requires Node 24.17.0 (see `.nvmrc`), pnpm 11.9.0, and Docker for the local database.

```bash
pnpm install
pnpm db:start     # MongoDB 8.2 as a single-node replica set, self-initiating
pnpm db:push      # sync schema AND create the out-of-band indexes — see below
pnpm dev          # web on :3001, API on :3000
```

Copy the env keys the schemas require into `apps/server/.env.local` and `apps/web/.env.local`; the
authoritative list is the env table in [`docs/RUNBOOK.md`](docs/RUNBOOK.md). The server fails fast on
invalid env rather than starting half-configured.

> **Always use `pnpm db:push`, never a bare `prisma db push`.** Two indexes cannot be expressed in
> the Prisma schema — the `elevationCache` TTL index and the `routes.path` `2dsphere` index — and are
> created out-of-band by `packages/db/src/setup-indexes.ts`, which `db:push` chains. A raw push
> silently drops them: the elevation cache stops expiring and route discovery fails. The server logs
> a loud `[startup] MISSING INDEX …` warning at boot if either is absent.

### Common commands

```bash
pnpm lint / pnpm check-types / pnpm test    # the three CI gates
pnpm build                                  # web → apps/web/dist, server → apps/server/dist/index.mjs
pnpm db:studio                              # browse the database
pnpm db:ping                                # connectivity smoke test
```

## Deployment

Web on Vercel (static build), API on Render (long-lived Node process), database on MongoDB Atlas.
Full procedure, environment reference, health checks and known limits:
[`docs/RUNBOOK.md`](docs/RUNBOOK.md). Rationale for that split:
[`docs/decisions/hosting.md`](docs/decisions/hosting.md).

Two things worth knowing before pointing anyone at a deployed instance:

- **`BETTER_AUTH_URL` must be `https://`.** Cookie `Secure`/`SameSite` flags are derived from the URL
  scheme, not from `NODE_ENV`, so an `http://` value silently produces cookies a cross-origin browser
  rejects.
- **`CORS_ORIGIN` is a single origin.** One web origin per deployment; preview URLs are not accepted.

## Known limits

- **Elevation quota** — the public OpenTopoData host allows roughly 1000 calls/day per IP, i.e. about
  100–200 *cold* route analyses per day across all users. At the ceiling, cold analyses degrade to a
  typed `ELEVATION_UNAVAILABLE` until the UTC day rolls over; cached analyses are unaffected. Lift it
  by self-hosting OpenTopoData (`OPENTOPODATA_BASE_URL`). See
  [`docs/decisions/elevation-quota.md`](docs/decisions/elevation-quota.md).
- **Trail snapping needs a Mapbox token.** Without `MAPBOX_ACCESS_TOKEN` it fails safe to straight
  lines between waypoints.
- **Free-tier cold starts** — the API sleeps after 15 minutes idle; the first request after that
  takes ~30s.
- **Single process** — HTTP and auth rate limits are in-memory, so they assume one server instance.

## Documentation

| | |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/PROJECT-SPEC.md`](docs/PROJECT-SPEC.md) | Technical specification |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Deployment and operations |
| [`docs/decisions/`](docs/decisions/) | Architecture decision records |
| [`docs/api/`](docs/api/) | Generated OpenAPI documents |
| [`docs/diagrams/`](docs/diagrams/) | Architecture and deployment diagrams |
| [`docs/benchmarks/`](docs/benchmarks/) | Cache and query measurements |
| [`docs/project-management/`](docs/project-management/) | Milestone tracker and task breakdowns |
| [`docs/report/`](docs/report/) | Capstone report |
