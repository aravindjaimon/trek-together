# Trek Together — Project Specification

> **Canonical specification** for **Trek Together** (Scaler Neovarsity / Woolf MSc backend capstone) —
> the authoritative, §-numbered source for scope, architecture, domain math, schema design, and the
> grading requirements. The build backlog in [`project-management/`](./project-management/) cites these
> sections as `PROJECT-SPEC.md §X`, so the section numbering below is load-bearing — keep it stable.
>
> **Working in the code?** Read the codebase working guide at [`../CLAUDE.md`](../CLAUDE.md) first. It
> maps this spec's intended layering (§3) and target structure (§4) onto the *actual* generated
> monorepo, lists the real scripts/ports, and tracks scaffold gaps. Where §4/§8 below describe a
> structure the scaffold didn't generate, the working guide reflects reality and wins.

---

## 1. What this project is

**Trek Together** — a trek route planner, difficulty grader, and community trek-logging app.

A user plots a trail on a map. The app pulls elevation data along the route, computes total
ascent/descent, estimates walking time (Naismith's rule + Tobler refinement), and assigns a
difficulty grade. It also produces offline-friendly itineraries and hosts a community layer where
people log completed treks and rate trails.

The technically interesting parts — and the reasons this is a good backend capstone — are the
**geospatial math**, **map rendering**, and **caching of expensive third-party elevation API calls**.

### Academic context (this is a graded capstone — treat it as such)

This is the **Capstone Project** for **Scaler Neovarsity / Woolf**, MSc in Computer Science,
**Backend Specialization**. Supervisor: **Naman Bhalla**.

Three deliverables are required:

1. A **public GitHub repository** link.
2. A **ZIP** of the full repo (proper folder structure + README).
3. A **PDF project report** (≥ 40 pages) following the WOOLF template
   (`Scaler Neovarsity _ Academy Project Report Template (Backend Specialization).docx`, in repo root).

Because it is graded on backend depth, **the backend is the star**. Geospatial query design,
document-schema design, the typed API request flow, and a measurable caching/indexing optimization
all need to be real and documented — see §13 (Report mapping). Build **iteratively with frequent,
dated commits**; the commit history is itself evidence of genuine work.

---

## 2. Tech stack

TypeScript full-stack, end-to-end type-safe. This is a genuine **MERN**-family stack (MongoDB ·
Express · React · Node), scaffolded with **Better-T-Stack** into a **Turborepo** monorepo and wired
together with a typed RPC layer (**oRPC**) and a batteries-included auth library (**Better-Auth**).

> ℹ️ **Stack history (important).** An earlier draft of this file assumed PostgreSQL + PostGIS (a
> "PERN" stack). That is **superseded** — the project is now MongoDB + Prisma per the chosen scaffold.
> Geospatial work rides on **MongoDB's GeoJSON + `2dsphere` indexes** (`$geoNear`, `$near`,
> `$geoWithin`), not PostGIS. Do not reintroduce PostgreSQL/PostGIS or raw SQL unless the stack is
> deliberately changed and this file is updated to match.

### Scaffold command (source of truth for the stack)

```bash
pnpm create better-t-stack@latest trek-together \
  --frontend tanstack-router --backend express --runtime node \
  --api orpc --auth better-auth --payments none \
  --database mongodb --orm prisma --db-setup docker \
  --package-manager pnpm --git --web-deploy none --server-deploy none \
  --no-install --addons husky mcp pwa skills turborepo --examples none
```

`--no-install` means dependencies are **not** installed yet — run `pnpm install` before anything else.
`--git` means Better-T-Stack initializes the repo with an initial scaffold commit.

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | **TypeScript** (strict) | TS-first end to end; shared types flow client ↔ server via oRPC. |
| Runtime | **Node.js v24.17.0** | Pin via `.nvmrc` / `engines`. ES modules. |
| Package manager | **pnpm v11.8.0** | Workspaces; `packageManager` field set in root `package.json`. |
| Monorepo | **Turborepo** | Task pipeline + caching (`turbo.json`); pnpm workspaces (`apps/*`). |
| API framework | **Express** | The HTTP server. "Top-notch Express" is an explicit goal — clean layering, validation, error handling. |
| API layer | **oRPC** | End-to-end typesafe procedures mounted on Express; OpenAPI-compatible (can export a spec → report/docs material). Replaces hand-written REST controllers. |
| Auth | **Better-Auth** | Email/password + sessions out of the box; Prisma adapter. Replaces hand-rolled JWT/bcrypt. |
| Database | **MongoDB** | GeoJSON geometry + `2dsphere` spatial indexes. Local dev via Docker (`--db-setup docker`). |
| ORM | **Prisma** (MongoDB provider) | Typed models + client. ⚠️ See §6 for two gotchas: `db push` only (no `migrate`), and geo queries need raw Mongo commands. |
| Frontend | **React + TanStack Router** (Vite) | Type-safe routing. Vite dev/build. |
| PWA | **vite-plugin-pwa** (addon) | Installable + offline service-worker caching — pairs directly with offline itineraries (§5.5). |
| Map rendering | **Leaflet** (react-leaflet) — app choice | Not part of the scaffold; add in `apps/web`. Free OSM tiles, no token. MapLibre/Mapbox GL is an acceptable upgrade. |
| Validation | **Zod** | oRPC procedure input/output schemas; validate every input. |
| Git hooks | **Husky** (addon) | Pre-commit lint/format/type-check. |
| Other addons | **mcp**, **skills** | `mcp` scaffolds an MCP server over the app API; `skills` adds Claude skills. Peripheral to the core capstone — keep but don't let them distract from backend depth. |
| Testing | Vitest + Supertest (API) | Aim for meaningful coverage of services + procedures. |

### External services (no vendor lock-in, both self-hostable)

- **Elevation:** [OpenTopoData](https://www.opentopodata.org/) (primary) and/or
  [Open-Elevation](https://open-elevation.com/). Both are rate-limited public APIs — caching is
  mandatory, not optional (see §9).
- **Map tiles:** OpenStreetMap tiles via Leaflet (respect OSM tile usage policy; use a proper
  `User-Agent` / attribution).

---

## 3. Architecture

Layered, type-safe backend; SPA (PWA) frontend. Turborepo orchestrates both apps.

```
apps/web  (React + TanStack Router + Vite, PWA)
        │  typed oRPC client over HTTP/JSON
        ▼
apps/server  (Node + Express)
  routers/      → oRPC procedures: input (Zod) → call a service → typed output (thin, no business logic)
  services/     → business logic: geospatial math, grading, time estimation, orchestration
  data/ (repos) → all Prisma access; raw Mongo commands for geospatial ($geoNear, 2dsphere)
  integrations/ → external API clients (OpenTopoData, Open-Elevation) + cache wrapper
  lib/          → Better-Auth setup, oRPC context, db client
        │
        ▼
MongoDB (Prisma)         elevation cache (Mongo collection w/ TTL; Redis optional)
```

**Rules of the layering:**

- oRPC procedures stay thin: validate input with Zod, call a service, return typed output. No DB calls, no math.
- Services hold the domain logic and are unit-testable without HTTP or a live DB where practical.
- The data/repository layer owns every Prisma call. Geospatial queries that Prisma can't express
  (`$geoNear`, `$near`, `$geoWithin`) live here via `prisma.$runCommandRaw` / `findRaw` / `aggregateRaw`.
- External API calls **always** go through the cache wrapper in `integrations/` — never call an
  elevation API directly from a service.
- One consistent response/error shape (oRPC typed errors) and centralized Express error handling.

---

## 4. Repository structure (Better-T-Stack monorepo — reconciled to the generated tree)

The scaffold is **package-based**: `apps/server` is a thin HTTP entrypoint; the API, auth, db, and env
logic live under `packages/*`, and cross-package imports use `@trek-together/<pkg>`. CLAUDE.md is the
operational source of truth for the layout; the actual tree (after M0) is:

```
trek-together/
├── CLAUDE.md                      # Claude Code working guide (codebase-reality oriented)
├── README.md                      # generated; expand with setup/run/architecture for grading (T9.1)
├── turbo.json                     # Turborepo task pipeline
├── pnpm-workspace.yaml            # workspaces: apps/*, packages/* (+ pnpm catalog)
├── bts.jsonc                      # Better-T-Stack config (records the chosen options)
├── package.json                   # root scripts (turbo), packageManager: pnpm@11.9.0, engines
├── biome.json                     # Biome lint + format config
├── vitest.config.ts               # Vitest (node env)
├── .nvmrc                         # Node 24.17.0
├── .husky/                        # pre-commit -> lint-staged (biome check --write)
├── docs/                          # PROJECT-SPEC.md, PRD.md, project-management/, report/  (add diagrams/, api/ in M9)
├── apps/
│   ├── web/                       # React + TanStack Router + Vite (PWA)
│   │   ├── src/{routes,components,lib,utils}/   #   pages; oRPC + auth clients
│   │   └── .env(.example)         #   VITE_SERVER_URL
│   └── server/                    # Express entrypoint ONLY
│       ├── src/index.ts           #   CORS + Better-Auth + oRPC handlers; GET /health; listens on env.PORT
│       └── .env(.example)         #   DATABASE_URL, BETTER_AUTH_*, CORS_ORIGIN, PORT, elevation keys (§10)
└── packages/
    ├── api/                       # oRPC layer
    │   └── src/{index.ts,context.ts,routers/}   #   + services/, data/, integrations/ to be added per §3
    ├── auth/                      # Better-Auth (Prisma adapter, mongodb) -> exports `auth`  (src/index.ts)
    ├── db/                        # Prisma + Docker
    │   ├── prisma/schema/{schema,auth}.prisma   #   provider = "mongodb"; generated/ is git-ignored
    │   ├── prisma.config.ts       #   loads ../../apps/server/.env
    │   ├── docker-compose.yml     #   MongoDB single-node replica set (rs0)
    │   └── src/{index.ts,ping.ts} #   exports `prisma`; `db:ping` smoke
    ├── env/                       # @t3-oss/env-core -> @trek-together/env/{server,web}
    ├── ui/                        # shared shadcn/ui primitives (@trek-together/ui)
    └── config/                    # shared tsconfig base
```

The §3 layering (procedures → services → data → integrations) maps onto `packages/api/src/`; the
`services/`, `data/`, and `integrations/` dirs are added as M1–M4 land. `docs/diagrams/` and
`docs/api/` are not generated — add them in M9.

---

## 5. Core domain concepts

These algorithms are the heart of the app and are **database-agnostic** — implement them in
`apps/server/src/services/` as pure, unit-tested TypeScript functions. Keep distances and elevations
in **metres** internally; convert at the API/UI boundary only.

### 5.1 Elevation sampling

A planned route is a polyline of `(lat, lng)` vertices. To get a useful elevation profile:

1. Densify the polyline — resample to roughly one point every **~30–90 m** (match the dataset
   resolution; SRTM is ~30 m / ~90 m). Too sparse misses climbs; too dense wastes API quota.
2. Batch the sample points into elevation API requests (**OpenTopoData allows up to 100 locations
   per request**). Cache each result (§9).
3. The result is an ordered array of `(distance_along_route_m, elevation_m)` — the **elevation profile**.

### 5.2 Total ascent / descent (cumulative gain/loss)

Sum positive deltas for ascent, negative deltas for descent over consecutive profile points:

```
ascent  = Σ max(0, eₙ − eₙ₋₁)
descent = Σ max(0, eₙ₋₁ − eₙ)
```

Raw SRTM data is noisy — apply light smoothing (e.g. a small moving average) or a minimum
elevation-change threshold (~3–5 m) before summing, or ascent figures will be inflated. Document
whatever smoothing you choose; it matters for the difficulty grade.

### 5.3 Time estimation

- **Naismith's rule (baseline):** allow **1 hour per 5 km** of distance **plus 1 hour per 600 m of
  ascent**. (Equivalently ≈ 5 km/h on the flat + ~10 min per 100 m climbed.)
- **Tobler's hiking function (refinement, slope-aware):** walking speed
  `W = 6 · exp(−3.5 · |S + 0.05|)` km/h, where `S = Δelevation / Δhorizontal` (rise/run). Peak speed
  ~6 km/h occurs on a gentle downhill (−5% grade). Integrate per profile segment for a better
  estimate on rolling/steep terrain.
- **Langmuir corrections (optional polish):** on descent, subtract ~10 min per 300 m for gentle
  declines (5–12°) and add ~10 min per 300 m for steep declines (>12°); optionally add a group-size
  fitness factor.

Implement Naismith first (simple, citable), then offer Tobler as a second estimate. Surfacing both
is good report material (compare predicted vs. typical actual times from the community logs).

### 5.4 Difficulty grading

Use the **Shenandoah National Park numerical rating**, which is simple, well-documented, and citable:

```
difficulty = sqrt( 2 × elevationGain × distance )
```

Bands (using the NPS unit basis of elevation gain in **feet** and distance in **miles**):

| Score | Grade |
|-------|-------|
| < 50 | Easiest |
| 50–100 | Moderate |
| 100–150 | Moderately strenuous |
| 150–200 | Strenuous |
| > 200 | Very strenuous |

Pick **one** unit basis, apply it consistently, and document it (the NPS reference uses feet + miles;
if you compute in metric, recalibrate the bands rather than mixing units). Consider also exposing a
simpler secondary signal such as NOLS "energy miles" = `distance + ascent/500`. Store the numeric
score **and** the band label so the UI and community filters can use either.

### 5.5 Offline-friendly itineraries

Let a user export a planned trek (route geometry, elevation profile, distance, ascent/descent, time,
difficulty, waypoints, notes) as a self-contained file — JSON and/or GPX, optionally a printable PDF.
Because all derived values are precomputed and cached, an exported itinerary needs no network access.
The **PWA addon** reinforces this: a service worker can cache the app shell and saved itineraries so
the planner works offline on the trail.

### 5.6 Community layer

Authenticated users (via Better-Auth) log completed treks against a planned/known route: date, actual
duration, a rating, a short note, optional photos. Aggregate these into per-route stats (average
actual time vs. predicted, popularity, average rating) — a nice contrast with the algorithmic
estimates and good material for the report's results section.

---

## 6. Database design (MongoDB + Prisma)

Document-oriented. Model collections via the multi-file Prisma schema
(`packages/db/prisma/schema/*.prisma`, `provider = "mongodb"`). Capture the final design as an
ER/collection diagram in `docs/diagrams/`.

### Two Prisma-on-MongoDB gotchas (document these in the report — they're real engineering)

1. **No migrations.** Prisma does not support `prisma migrate` on MongoDB — use **`prisma db push`**
   to sync the schema. There is no SQL migration history.
2. **Geospatial isn't first-class in Prisma.** Prisma's schema/query API has no geometry type or geo
   operators. Store geometry as embedded **GeoJSON** (e.g. `{ type: "LineString", coordinates: [...] }`)
   in a `Json` field, create **`2dsphere`** indexes outside Prisma (a setup script using
   `db.collection.createIndex(...)` via mongosh, or `prisma.$runCommandRaw`), and run geo queries
   with `findRaw` / `aggregateRaw` / `$runCommandRaw` (`$geoNear`, `$near`, `$geoWithin`).
3. **Replica set required.** Prisma's MongoDB connector needs a replica set (for transactions). The
   Docker setup from `--db-setup docker` provisions a single-node replica set for local dev.

### Core collections (refine during design)

- **Better-Auth collections** — `user`, `session`, `account`, `verification` are created/managed by
  Better-Auth's Prisma adapter. Treat `user` as the identity root; reference it from app data.
- **routes** — `id`, `ownerId → user`, `name`, `description`, `path` (GeoJSON LineString),
  `elevationProfile` (embedded array of `{ distanceAlongM, elevationM }` — embed; it's read with the
  route), `distanceM`, `ascentM`, `descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`,
  `difficultyBand`, `isPublic`, `createdAt`, `updatedAt`.
- **elevationCache** — keyed by quantized `(lat,lng)` (rounded to dataset resolution) or geohash →
  `elevationM`, `dataset`, `fetchedAt`. Add a **TTL index** on `fetchedAt` to expire stale points and
  a **unique index** on the quantized key. The backbone of the §9 optimization.
- **trekLogs** — `id`, `userId → user`, `routeId → routes`, `completedOn`, `actualDurationS`,
  `rating` (1–5), `notes`, `createdAt`.

**Indexing:** `2dsphere` on `routes.path` (and any point field you query by location); standard
indexes on `ownerId`, `routeId`, `isPublic`, `difficultyScore` for browsing/filtering. The before/after
of adding these indexes (via `explain("executionStats")`) is a candidate for the report's optimization
benchmark.

**Embedding vs. referencing** is itself a design talking point: embed the elevation profile in the
route (read together, bounded size); reference users and trek logs (independent lifecycles, unbounded).

---

## 7. API design (oRPC on Express)

- Typed **oRPC** procedures grouped by domain (`auth`, `routes`, `logs`). oRPC is OpenAPI-compatible —
  export a spec into `docs/api/` for the report and for a Swagger/Postman view.
- Auth via **Better-Auth** (session cookies by default; bearer supported). Protect write/personal
  procedures with an auth-checked oRPC context; never hand-roll JWT.
- Validate every input with **Zod** at the procedure boundary; return typed validation errors.
- Consistent success/error shape via oRPC's typed errors; centralize unexpected-error handling in Express.
- Paginate list procedures (`page`, `limit`); cap `limit`.

Representative procedures (names illustrative — not exhaustive):

```
auth.*                      # provided by Better-Auth (register, login, session, logout)
routes.snap                 # snap ≤25 waypoints onto real walking paths (Mapbox; falls back to a straight line)
routes.analyze              # input: polyline → elevation profile, ascent/descent, time, grade
routes.create               # save a planned route (auth)
routes.getById              # shared/public route view (public if isPublic)
routes.listMine             # the user's own routes (auth, paginated)
routes.update               # edit a route's name/description/visibility (auth, owner)
routes.remove               # delete a route (auth, owner)
routes.explore              # public routes near a point ($geoNear, paginated) — implements the "routes near me" query
routes.exportItinerary      # format: gpx | json
logs.create                 # log a completed trek (auth)
logs.listForRoute           # community logs + aggregate stats
```

> As built (Trail-Ready v1.0): `routes.explore` (`$geoNear`) supersedes the earlier `routes.list`
> sketch; `routes.snap`, `routes.update`, and `routes.remove` were added. The community layer
> (`logs.*`, §5.6) is in scope as of 2026-07-11 — see the PRD §4 scope-change note.

`routes.analyze` is the **flagship feature** — choose it as the "feature development process"
deep-dive in the report (§13): payload → procedure → service → elevation cache → grading/time math.

---

## 8. Development commands (reconciled to the generated `package.json`)

Dependencies are installed. Use Node **v24.17.0** (`.nvmrc`) and pnpm **v11.9.0** — the scaffold pinned
11.9.0, not the 11.8.0 originally specified here; `engines` enforces `node >=24.17.0`, `pnpm >=11.9.0`.

```bash
pnpm install              # one-time

# Database (MongoDB via Docker, single-node replica set rs0)
pnpm db:start             # docker compose up -d
pnpm db:push              # prisma db push (sync schema — NOT migrate, see §6)
pnpm db:ping              # smoke check: connect + $runCommandRaw({ ping: 1 })
pnpm db:studio            # Prisma Studio
pnpm db:stop | db:down    # stop / tear down
# The 2dsphere geo-index setup script lands with M4 (routes collection) — see §6.

# Dev (Turborepo)
pnpm dev                  # turbo dev (web + server; server on env.PORT, default 3000)
pnpm dev:web | dev:server

# Quality / build
pnpm check-types          # turbo check-types (tsc)
pnpm lint                 # biome check  (lint + format + import sort)
pnpm format               # biome format --write
pnpm test                 # vitest run
pnpm build                # turbo build
```

The Husky pre-commit runs **lint-staged → `biome check --write`** (lint + format on staged files); run
`pnpm check-types` separately (kept out of the hook for commit speed). `pnpm db:migrate` exists but
**must never be run** — Prisma migrate is unsupported on MongoDB (§6).

---

## 9. Caching & performance (the report's optimization story)

The WOOLF template **requires** a feature-development deep-dive with a measured performance
improvement (cache → lower response time; indexing → faster queries). Build this in deliberately:

- **Elevation cache.** Elevation APIs are slow and rate-limited (**OpenTopoData: ~1 req/sec,
  ~1,000/day, 100 points/request**; **Open-Elevation: ~1,000 requests/month** on the public host).
  Cache every sampled point in the **`elevationCache` Mongo collection** (TTL + unique-key index;
  quantize coordinates so nearby requests hit the cache). Measure `routes.analyze` latency
  **cold vs. warm** and record the numbers — this is the headline benchmark. (Redis/ElastiCache is a
  valid production upgrade, but no Redis is provisioned by the scaffold — the Mongo collection needs
  zero extra infra.)
- **Indexes.** Benchmark a representative query (e.g. "public routes within N km" via `$geoNear`, or
  "filter by difficulty") before and after adding the `2dsphere` / standard indexes; capture
  `explain("executionStats")` output.
- **Batch + rate-limit** outbound elevation calls (respect 100 points/request and 1 req/sec); add a
  client-side limiter so the app never trips the public quota.
- Keep before/after numbers, the method, and `explain()` output in `docs/` as you go — don't
  reconstruct them at report-writing time.

---

## 10. Environment variables

Better-T-Stack generates `.env` files per app (git-ignored). Maintain a committed `.env.example`
mirroring the keys. Expected (verify against generated files):

```
# apps/server/.env
DATABASE_URL=mongodb://localhost:27017/trek_together?replicaSet=rs0
CORS_ORIGIN=http://localhost:3001
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=http://localhost:3000
PORT=3000

# Elevation providers (add)
ELEVATION_PROVIDER=opentopodata        # opentopodata | open-elevation
OPENTOPODATA_BASE_URL=https://api.opentopodata.org/v1
OPENTOPODATA_DATASET=srtm30m
OPEN_ELEVATION_BASE_URL=https://api.open-elevation.com/api/v1

# apps/web/.env
VITE_SERVER_URL=http://localhost:3000
# VITE_MAPBOX_TOKEN=...   # only if using Mapbox instead of Leaflet/OSM
```

Ports above are illustrative — use whatever the scaffold assigns. **Never commit secrets**; ensure
real `.env` files stay in `.gitignore` (the scaffold's `.gitignore` should already cover them).

---

## 11. Coding conventions

- **TypeScript strict**, ES modules, `async/await`, no floating promises. Lint/format via the
  scaffold's tooling; fix before committing (Husky enforces this).
- Layer discipline (§3): oRPC procedures thin, services pure-ish, data layer owns all Prisma/Mongo access.
- Validate all external input with **Zod**. Prisma parameterizes queries; when using
  `$runCommandRaw`/`aggregateRaw` for geo, still validate and never string-concatenate user input
  into query objects.
- Keep units explicit in names (`distanceM`, `ascentM`, `durationS`). Internal SI, convert at edges.
- Small, focused modules. Domain math lives in services and is unit-tested with known fixtures
  (e.g. a route with a known ascent → known Naismith time → known grade).
- Lean on end-to-end types: let oRPC infer client types from server procedures rather than duplicating
  shapes. Don't leak stack traces in production.

---

## 12. Git & commit discipline

The capstone is explicitly graded on **iterative, periodic commits** — a single mega-commit looks
like (and may be treated as) plagiarism. `--git` gives an initial scaffold commit; build from there.

- Commit small, logical units of work **frequently and dated over time**, in parallel with classes.
- Use clear messages, ideally Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`,
  `chore:`). Husky may run hooks on commit — keep them passing.
- Keep the GitHub repo **public**.
- Don't commit `node_modules/`, `.env`, build output (`dist/`, `.turbo/`), or large binaries — rely on
  the generated `.gitignore` and extend it as needed.
- The `.DS_Store` currently in the repo should be git-ignored.

---

## 13. Mapping code → WOOLF report sections

Every report section should be backed by real artifacts produced while building. Keep these current
as you go rather than reverse-engineering them at the end:

| Report section | Backed by |
|----------------|-----------|
| Project Description | This overview + a process/flow diagram (`docs/diagrams/`). |
| Requirement Gathering | Functional/non-functional requirements, users, use-case diagram, feature table. |
| Class Diagrams (LLD) | oRPC routers, service classes, data/repository modules, Prisma models → draw.io diagram. |
| Database Schema Design | §6 collections, Prisma schema, embedding vs. referencing rationale, `2dsphere` indexes, ER/collection diagram. |
| Feature Development Process | **`routes.analyze`**: payload → oRPC procedure → service → elevation cache → grading (typed flow) + the cache benchmark (§9). |
| Deployment Flow | **Actually deployed:** Render (Node/Express server) + Vercel (static web) + **MongoDB Atlas** — see `docs/RUNBOOK.md` and `docs/decisions/hosting.md`. The AWS topology below remains the documented production-scale target, per this template's "document even if deployed minimally": EC2 (or Elastic Beanstalk) for the server, VPC + security groups, MongoDB Atlas or Amazon DocumentDB, optional ElastiCache (Redis) if caching is upgraded. |
| Technologies Used | Node, Express, oRPC, MongoDB, Prisma, React/TanStack Router, Better-Auth, Turborepo, PWA — what each is and a real-world use. |
| Conclusion | Takeaways, real-world applications, limitations (API quotas, SRTM accuracy, Prisma-on-Mongo geo limits), future work. |
| References | Cite every external source (APIs, formulas, libraries) — see §15 and report format rules below. |

Report format rules from the template: ≥ 40 pages; Times New Roman 14 (headings) / 12 (body), black;
margins 1.25" L/R, 1" T/B; 1.5 line spacing (single for lists/references); justified body; centered
title/chapter headings; numbered tables/figures as `Table 2.02` (chapter.number) with captions
(figure captions **below**, table captions **above**).

---

## 14. Dos & Don'ts (academic integrity + stack hygiene)

**Do**

- Build iteratively with frequent dated commits; keep README and `docs/` current.
- Maintain the clear monorepo structure and a thorough README (setup, run, architecture, screenshots).
- Use `prisma db push` (not `migrate`) for schema changes; create `2dsphere` indexes via a setup script.
- Run geospatial queries through the data layer's raw-Mongo helpers; keep services DB-agnostic.
- Cite every external source used (articles, formulas, libraries) in the report's References.
- Acknowledge AI-tool assistance via citation, as the template's declaration requires.

**Don't**

- **Don't plagiarize** — code or report prose. Paraphrase and cite; never paste uncredited.
- Don't reintroduce PostgreSQL/PostGIS or raw SQL (the stack is MongoDB + Prisma — §2).
- Don't try `prisma migrate` on MongoDB, and don't expect Prisma to run geo operators directly (§6).
- Don't call elevation APIs without going through the cache, or exceed their public quotas.
- Don't commit secrets, `node_modules`, `.turbo/`, or build artifacts.

---

## 15. Working agreements for Claude (in this repo)

- Respect the layering in §3 and the Better-T-Stack stack in §2 (MongoDB · Prisma · oRPC · Better-Auth ·
  Express · React/TanStack Router · Turborepo). Flag, don't silently change, the stack.
- When adding a feature, also: update `README.md`, add/adjust Vitest tests, and note any report-relevant
  artifact (diagram, benchmark) in `docs/`.
- Keep §4 (structure) and §8 (commands) accurate as the repo grows — once the scaffold is generated,
  reconcile the real paths/scripts and update this file.
- Prefer oRPC procedures + Zod over ad-hoc Express handlers; prefer Prisma for normal access and raw
  Mongo commands only for geospatial.
- Always route external elevation calls through the cache wrapper; respect rate limits.
- This is a graded, individual capstone: prioritize correctness, clear design, and honest,
  well-cited work over shortcuts.

---

## 16. References (verify current details at implementation time)

- Better-T-Stack — https://better-t-stack.dev/
- oRPC — https://orpc.unnoq.com/
- Better-Auth — https://www.better-auth.com/
- Prisma + MongoDB — https://www.prisma.io/docs/orm/overview/databases/mongodb
- MongoDB geospatial queries & `2dsphere` — https://www.mongodb.com/docs/manual/geospatial-queries/
- TanStack Router — https://tanstack.com/router
- Turborepo — https://turborepo.com/docs
- OpenTopoData API — https://www.opentopodata.org/api/ (limits: 100 locations/request, 1 call/sec, 1000 calls/day on the public host)
- Open-Elevation API — https://open-elevation.com/ (public host free up to ~1,000 requests/month)
- Naismith's rule & Tobler's hiking function — https://en.wikipedia.org/wiki/Naismith%27s_rule and https://en.wikipedia.org/wiki/Tobler%27s_hiking_function
- Hiking difficulty (Shenandoah NPS) — https://www.nps.gov/shen/planyourvisit/how-to-determine-hiking-difficulty.htm
- Leaflet — https://leafletjs.com/
