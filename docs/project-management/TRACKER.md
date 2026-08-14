# Trek Together — Progress Tracker

> Living, at-a-glance status board for the whole backlog. The canonical task list and dependency
> detail live in [`README.md`](./README.md) and the per-task files; this file just answers
> **"what's done and what's not."** Statuses are **auditable, not aspirational** — each M0 row cites
> concrete evidence. Keep this in sync with each task file's `Status` row as work lands.

> **Re-audit 2026-08-14 (deployment).** Three rows below were marked ☑ for artifacts that were never
> committed — `git log --all` finds no trace of `.github/workflows/ci.yml` (T10.5),
> `apps/server/Dockerfile` (T12.1) or `docker-compose.prod.yml` (T12.2), and no `README.md` ever
> existed despite T9.1/T12.4. T10.5 and the README are now real; T12.1/T12.2 are struck as
> **superseded** — hosting is Render + Vercel + Atlas and needs no image
> ([`../decisions/hosting.md`](../decisions/hosting.md)). T0.8 is closed. Corrected totals are in the
> per-milestone tables; the 2026-07-12 summary below is kept as written for history.

**Last audited:** 2026-07-12 — **Trail-Ready v1.0 COMPLETE (91/92; 1 user-owned)** — **T9.8 WOOLF
report assembled** (50 pp, template-strict structure, `docs/report/Trek-Together-Report.{docx,pdf}`) +
**M13 optimization pass (1/1)** landed post-v1.0: behavior-preserving perf/hygiene wins
(query caching, projected logs authz gate, lucide dedup, CI double-build), gates still green.
M0–M9 (65/66), M10 stabilize & harden (15/15), M11 community trek logs (7/7), M12 deploy-ready (4/4)
all done. 194 tests green; server image builds and runs (Docker-verified: `/health` db-ok, real
`$geoNear` query, graceful SIGTERM). M1–M6 backend: elevation cache, analysis math, flagship
`routes.analyze`, persisted `routes.*` CRUD + authz, GPX/JSON export, `$geoNear` explore — with
cold/warm + 2dsphere benchmarks. M7 frontend (8/8) browser-verified end-to-end; M8 PWA (4/4)
offline-verified; M9 docs (8/8). Post-M9, three unbacklogged features landed (now covered by M10/M11
reconciliation): `routes.snap` trail snapping (Mapbox), "near me" geolocation, auth-screen redesign.
**Trail-Ready v1.0** (audit of 2026-07-11): **M10** stabilize & harden (quota/null-elevation/HTTP
criticals, lifecycle, error/offline UX, a11y evidence) · **M11** community trek logs (SPEC §5.6, now
in scope) · **M12** deploy-ready (Dockerfile, prod compose, runbook). Gates `lint`/`check-types`/
`test` exit 0. **Still open from M0–M9: T0.8 (user-owned GitHub push + repo ZIP for submission).**

## Legend

| Symbol | Meaning |
|---|---|
| ☑ | Done |
| ◐ | In progress / partial |
| ☐ | Not started |
| ⊘ | Superseded — no longer applicable (reason given inline) |
| ⊘ | Blocked / skipped (see note) |

## Overall progress

| Milestone | Goal | ☑ | ◐ | ☐ | Total |
|---|---|:--:|:--:|:--:|:--:|
| **M0** Scaffold | Stand up the Better-T-Stack monorepo | 7 | 1 | 0 | 8 |
| **M1** Elevation + cache | Provider clients + cache-first wrapper | 7 | 0 | 0 | 7 |
| **M2** Analysis math | Pure domain math (sampling → grade) | 8 | 0 | 0 | 8 |
| **M3** `routes.analyze` | Flagship procedure + cold/warm benchmark | 6 | 0 | 0 | 6 |
| **M4** Persistence | Route schema, 2dsphere, repo, authz | 8 | 0 | 0 | 8 |
| **M5** Share + export | Share-by-link + GPX/JSON export | 5 | 0 | 0 | 5 |
| **M6** Explore | `$geoNear` query + index benchmark | 4 | 0 | 0 | 4 |
| **M7** Frontend | Map planner, profile chart, auth UI | 8 | 0 | 0 | 8 |
| **M8** PWA & offline | Installable PWA + offline caching | 4 | 0 | 0 | 4 |
| **M9** Docs & report | README, diagrams, OpenAPI, WOOLF report | 8 | 0 | 0 | 8 |
| **M10** Stabilize & harden | Typed degradation, quota/HTTP hardening, error/offline UX | 15 | 0 | 0 | 15 |
| **M11** Community logs | TrekLog model, `logs.*`, stats, UI (SPEC §5.6) | 7 | 0 | 0 | 7 |
| **M12** Deploy-ready | Dockerfile, prod compose, runbook | 4 | 0 | 0 | 4 |
| **Total** | | **91** | **1** | **0** | **92** |

---

## M0 — Scaffold (7 ☑ · 1 ◐ · 0 ☐)

Detailed because this is the only milestone with real progress. "What's left" is the gap to that task's
Acceptance Criteria.

| Task | Title | Pri | Status | Evidence / what's left |
|---|---|:--:|:--:|---|
| [T0.1](./M0-scaffold/t0-1-generate-the-better-t-stack-scaffold.md) | Generate the Better-T-Stack scaffold | P0 | ☑ | `apps/web` + `apps/server`, `bts.jsonc` (git-tracked), `turbo.json`, `pnpm-workspace.yaml`, `.husky/` present; `docs/` PRD/PROJECT-SPEC/`.docx` preserved; scaffold commit `601ab99`. |
| [T0.2](./M0-scaffold/t0-2-install-dependencies-pin-the-toolchain.md) | Install deps & pin the toolchain | P0 | ☑ | `.nvmrc=24.17.0` + `engines` (`node>=24.17.0`, `pnpm>=11.9.0`); Biome 2.5.1 lint+format gate (`biome.json`, root `lint`/`format`/`test` scripts, `lint-staged` → `biome check --write`); Vitest 4.1.9 + `cn()` smoke (3 pass). `pnpm lint`/`check-types`/`test` green. `packageManager pnpm@11.9.0` vs spec's `11.8.0` (delta → T0.8). |
| [T0.3](./M0-scaffold/t0-3-provision-mongodb-docker-single-node-replica-set.md) | Provision MongoDB (single-node replica set) | P0 | ☑ | `packages/db/docker-compose.yml` runs `--replSet rs0` (local auth dropped) with a self-initiating healthcheck; `rs.status().ok===1`, PRIMARY at `localhost:27017`. `pnpm db:start` works; data persists across `down`/`up` (named volume). `DATABASE_URL` → `?replicaSet=rs0&directConnection=true`. |
| [T0.4](./M0-scaffold/t0-4-prisma-schema-skeleton-db-push-client.md) | Prisma schema skeleton + db push + client | P0 | ☑ | `provider="mongodb"` ✓; `pnpm db:push` synced indexes against `rs0` + regenerated client; reusable `pnpm db:ping` smoke → `{"ok":1}`. No `migrations/` by design. |
| [T0.5](./M0-scaffold/t0-5-wire-better-auth-email-password-sessions.md) | Wire Better-Auth (email/password + sessions) | P0 | ☑ | Env-conditional cookies (dev `SameSite=Lax`/insecure, prod `None`/secure). Full flow verified via curl: register/login/logout 200 + cookie; session persists; `get-session`→null after logout; `/rpc/privateData` 200 w/ cookie & 401 without; wrong password → 401. |
| [T0.6](./M0-scaffold/t0-6-express-orpc-base-context-handler-health.md) | Express + oRPC base (context, handler, health) | P0 | ☑ | Boots on `env.PORT`; `GET /health` → 200; `POST /rpc/healthCheck` → 200 `"OK"`. Context (`packages/api/src/context.ts`) now `{ db, session, requestId }`. Centralised error handling deferred to T3.4. |
| [T0.7](./M0-scaffold/t0-7-environment-config-committed-envexample.md) | Environment config + committed `.env.example` | P1 | ☑ | Per-app `apps/server/.env.example` + `apps/web/.env.example` committed (real `.env` git-ignored, verified). Server env schema (`packages/env/src/server.ts`) extended with `PORT` + optional elevation keys; fail-fast on invalid env demoed. `.DS_Store` already ignored. |
| [T0.8](./M0-scaffold/t0-8-baseline-commit-reconcile-claudemd-4-8-green-hooks.md) | Baseline commit, reconcile §4/§8, green hooks | P1 | ☑ | PROJECT-SPEC §4/§8 (+§6 path) reconciled to the package-based tree & real scripts; `lint-staged → biome check` now does real work (green on every M0 commit). **Closed 2026-08-14:** public GitHub repo created and pushed, `main` fast-forwarded to `development`, `docs/` + `README.md` moved into the repo, envx `.gpg` blobs untracked before publishing. |

**Recommended next:** M0 is complete and all gates are green (`lint`/`check-types`/`test`/`build`).
T0.8's push closed on 2026-08-14, so M0 is 8/8. M1 (7/7) and M2 (8/8) are complete.

---

## M1 — Elevation integration + cache (7/7)

Build provider clients and a cache-first wrapper. **Depends on T0.4/T0.6.**

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T1.1 | OpenTopoData provider client | P0 | ☑ | T0.6 |
| T1.2 | Open-Elevation fallback client | P1 | ☑ | T1.1 |
| T1.3 | Batching (≤100/req) + rate limiting (≤1 req/s) | P0 | ☑ | T1.1 |
| T1.4 | elevationCache collection + unique & TTL indexes | P0 | ☑ | T0.4 |
| T1.5 | Cache-first wrapper (quantise, write-through) | P0 | ☑ | T1.1, T1.4 |
| T1.6 | Provider fallback + graceful degradation | P1 | ☑ | T1.2, T1.5 |
| T1.7 | Unit tests (client, limiter, cache; HTTP mocked) | P0 | ☑ | T1.5 |

## M2 — Analysis math (8/8)

Pure, unit-tested domain math: sampling, smoothing, ascent/descent, Naismith, Tobler, Shenandoah.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T2.1 | Geo utils: haversine + polyline densification | P0 | ☑ | T0.2 |
| T2.2 | Elevation sampling pipeline | P0 | ☑ | T1.5, T2.1 |
| T2.3 | Smoothing / minimum-change threshold | P0 | ☑ | T2.2 |
| T2.4 | Ascent / descent computation | P0 | ☑ | T2.3 |
| T2.5 | Naismith time estimate | P0 | ☑ | T2.1 |
| T2.6 | Tobler time estimate (per-segment integration) | P1 | ☑ | T2.4 |
| T2.7 | Shenandoah difficulty score + band | P0 | ☑ | T2.4 |
| T2.8 | Unit tests against known fixtures | P0 | ☑ | T2.4–T2.7 |

## M3 — `routes.analyze` end-to-end (6/6)

Wire the flagship procedure and capture the cold-vs-warm benchmark.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T3.1 | Zod input/output schemas for analyze | P0 | ☑ | `packages/api/src/routers/routes/analyze.schema.ts`: input (path ≥2 ≤500, coord ranges, `spacingM` 10–1000 default 60) + output (profile, distance, ascent/descent, Naismith/Tobler, difficulty score+band, optional cache meta). Inferred `AnalyzeInput`/`AnalyzeOutput` reused by service. Note: path is `packages/api`, not `apps/server` (per CLAUDE.md layering). |
| T3.2 | Analysis service orchestration | P0 | ☑ | `packages/api/src/services/analyze.ts` — `analyzeRoute(path, elevationClient, opts)`: buildProfile→smooth→gainLoss→Naismith+Tobler→difficulty, framework-free (injected client). Captures cache stats into `meta` via a spy wrapper; size-guard throws `RouteTooLargeError`. 4 unit tests. |
| T3.3 | `routes.analyze` oRPC procedure (thin) | P0 | ☑ | `packages/api/src/routers/routes/analyze.ts` — thin public (anon-OK) procedure: Zod in → `analyzeRoute` → typed out; maps `RouteTooLargeError`→`VALIDATION`, `ElevationUnavailableError`→`ELEVATION_UNAVAILABLE`. Registered as `routes.analyze` (`/rpc/routes/analyze`); default cache client wired in `integrations/elevation/default-service.ts`. |
| T3.4 | Typed errors + centralised Express handling | P0 | ☑ | Shared oRPC error catalogue (`packages/api/src/errors.ts`: `VALIDATION`/`NOT_FOUND`/`UNAUTHORIZED`/`ELEVATION_UNAVAILABLE`/`INTERNAL`) attached on the base builder; `requireAuth` throws typed `UNAUTHORIZED`; final Express error middleware in `apps/server/src/index.ts` returns a safe `INTERNAL` envelope, never a stack. |
| T3.5 | Cold-vs-warm cache benchmark harness | P0 | ☑ | `apps/server/scripts/bench-analyze.ts` (`pnpm -F server bench:analyze`): clears cache → cold → warm×10. Real run recorded in `docs/benchmarks/cache.md` — cold 575.6 ms → warm p50 2.4 ms / p95 2.9 ms, 100 % hit ratio (**~241× speed-up**) on a 42-point Shenandoah route. |
| T3.6 | Integration tests (Supertest) | P0 | ☑ | `packages/api/src/routers/routes/analyze.test.ts` — HTTP round-trip via the oRPC client over an ephemeral `node:http` server (substituted for Supertest; RPC envelope impractical to hand-craft). Asserts happy path (anonymous), typed `BAD_REQUEST` on invalid input. Offline via `vi.mock` of the elevation client. 133 tests green. |

## M4 — Persistence (8/8)

Route schema, 2dsphere index, repository, create/getById/listMine with authz.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T4.1 | Route model (GeoJSON in Json, embedded profile) + db push | P0 | ☑ | T0.4 |
| T4.2 | 2dsphere index setup script | P0 | ☑ | T4.1 |
| T4.3 | Routes repository (data layer) | P0 | ☑ | T4.1 |
| T4.4 | `routes.create` (auth) | P0 | ☑ | T4.3, T3.3 |
| T4.5 | `routes.getById` (public if isPublic) | P0 | ☑ | T4.3 |
| T4.6 | `routes.listMine` (auth, paginated) | P0 | ☑ | T4.3 |
| T4.7 | AuthZ + ownership enforcement | P0 | ☑ | T4.4–T4.6 |
| T4.8 | Persistence + authz tests | P0 | ☑ | T4.4–T4.7 |

## M5 — Share + export (5/5)

Public share-by-link view and GPX/JSON itinerary export.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T5.1 | Public share-by-link view (anonymous getById) | P1 | ☑ | T4.5 |
| T5.2 | GPX export builder | P1 | ☑ | T4.3 |
| T5.3 | JSON itinerary export builder | P1 | ☑ | T4.3 |
| T5.4 | `routes.exportItinerary` procedure (gpx\|json) | P1 | ☑ | T5.2, T5.3 |
| T5.5 | Export + anonymous-access tests | P1 | ☑ | T5.1, T5.4 |

## M6 — Explore (routes near me) (4/4)

`$geoNear` explore query and index on/off benchmark.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T6.1 | `$geoNear` explore query (aggregateRaw, data layer) | P0 | ☑ | T4.2 |
| T6.2 | `routes.explore` procedure (paginated, capped limit) | P0 | ☑ | T6.1 |
| T6.3 | Index on/off benchmark with `explain()` | P0 | ☑ | T6.1 |
| T6.4 | Explore tests + plan verification | P1 | ☑ | T6.2 |

## M7 — Frontend (8/8)

React/TanStack map planner, profile chart, difficulty badge, route view, explore map.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T7.1 | oRPC client + auth-client wiring | P0 | ☑ | T0.5, T0.6 |
| T7.2 | Auth UI (register/login/logout, persistence) | P0 | ☑ | T7.1 |
| T7.3 | Leaflet map + route planner | P0 | ☑ | T7.1 |
| T7.4 | Analyze action + elevation profile chart | P0 | ☑ | T7.3, T3.3 |
| T7.5 | Difficulty badge + time/ascent summary | P1 | ☑ | T7.4 |
| T7.6 | Save form + listMine view | P1 | ☑ | T7.3, T4.4, T4.6 |
| T7.7 | Public route view + export buttons | P1 | ☑ | T4.5, T5.4 |
| T7.8 | Explore map (routes near me) | P1 | ☑ | T6.2 |

## M8 — PWA & offline (4/4)

Installable PWA; service-worker caching of shell + viewed/saved itineraries.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T8.1 | PWA manifest + install (vite-plugin-pwa) | P1 | ☑ | T7.1 |
| T8.2 | Service worker app-shell precache | P1 | ☑ | T8.1 |
| T8.3 | Runtime caching of itineraries + OSM tile policy | P1 | ☑ | T8.2, T7.7 |
| T8.4 | Offline verification | P1 | ☑ | T8.3 |

## M9 — Docs & report (8/8)

README, diagrams, OpenAPI export, consolidated benchmarks, WOOLF report (≥40 pp).

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T9.1 | README (setup, run, architecture, screenshots) | P0 | ☑ | M3–M6 |
| T9.2 | Use-case diagram | P1 | ☑ | — |
| T9.3 | Class diagram (LLD) | P1 | ☑ | M3, M4 |
| T9.4 | ER / collection schema diagram | P1 | ☑ | M4 |
| T9.5 | Deployment diagram (AWS target) | P1 | ☑ | — |
| T9.6 | OpenAPI export to docs/api/ | P1 | ☑ | M3–M6 |
| T9.7 | Consolidate benchmark artifacts | P0 | ☑ | T3.5, T6.3 |
| T9.8 | WOOLF report assembly (≥40 pp) | P0 | ☑ | all |

---

## M10 — Stabilize & Harden (15/15)

Trail-Ready v1.0: every dependency fails typed and recoverable; the server survives restarts,
floods, and quota exhaustion; every UI state is designed. See
[`M10-stabilize-harden/README.md`](./M10-stabilize-harden/README.md).

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T10.1 | Snap procedure tests (snap.test.ts + vertex-cap coverage) | P0 | ☑ | — |
| T10.2 | Snap race guard + 25-waypoint client cap | P0 | ☑ | T10.1 |
| T10.3 | Explore fit-bounds after locate + drop home health toast | P1 | ☑ | — |
| T10.4 | Preserve plan draft across login (sessionStorage) | P1 | ☑ | T10.2 |
| T10.5 | CI workflow (lint/check-types/test/build) | P0 | ☑ | — |
| T10.6 | Elevation quota hardening: global limiter, breaker, retry | P0 | ☑ | — |
| T10.7 | Tolerate null-elevation gaps with coverage threshold | P0 | ☑ | T10.6 |
| T10.8 | HTTP hardening: helmet, rate limits, body caps | P0 | ☑ | — |
| T10.9 | Server lifecycle: graceful shutdown, real /health, index verify | P1 | ☑ | T10.8 |
| T10.10 | Request logging + quiet expected errors | P1 | ☑ | T10.9 |
| T10.11 | Chores: pin mongo:8.2, reuse prisma singleton in auth | P2 | ☑ | — |
| T10.12 | Error cards on Explore/My Routes + 60s client timeout | P1 | ☑ | — |
| T10.13 | Delete confirmation + clear persisted cache on sign-out | P1 | ☑ | — |
| T10.14 | Offline banner + offline-aware empty states | P1 | ☑ | T10.12 |
| T10.15 | A11y verification pass (axe/Lighthouse + evidence) | P1 | ☑ | T10.12–T10.14 |

> **T10.5 correction (2026-08-14).** This was marked ☑ but `.github/workflows/ci.yml` was never
> committed — the RUNBOOK's "CI" section described a workflow that did not exist. The workflow is now
> real and runs the same four gates on push/PR to `development`/`main`.

## M11 — Community Trek Logs (7/7)

The SPEC §5.6 community layer, previously a PRD non-goal, now in scope: log completed treks
(date, actual duration, rating 1–5, notes) with per-route aggregate stats.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T11.1 | Docs reconciliation (PRD/SPEC: snap + logs in scope, API tables) | P0 | ☑ | — |
| T11.2 | TrekLog Prisma model + db push | P0 | ☑ | T11.1 |
| T11.3 | Logs repo (create, listForRoute, statsForRoute) | P0 | ☑ | T11.2 |
| T11.4 | `logs.create` + `logs.listForRoute` procedures | P0 | ☑ | T11.3 |
| T11.5 | Logs integration tests | P0 | ☑ | T11.4 |
| T11.6 | Trek logs UI on `/r/:id` (stats line, list, form) | P1 | ☑ | T11.4 |
| T11.7 | OpenAPI re-export + tracker close-out | P2 | ☑ | T11.4 |

## M12 — Deploy-Ready (2/2 + 2 superseded)

Originally "one `docker build` from production", with hosting out of scope. **Re-scoped 2026-08-14**
to actual hosting on Render + Vercel + MongoDB Atlas
([`../decisions/hosting.md`](../decisions/hosting.md)), which needs no container image.

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T12.1 | Dockerfile + .dockerignore (multi-stage server image) | P0 | ⊘ | T10.5, T10.9 |
| T12.2 | docker-compose.prod.yml | P1 | ⊘ | T12.1 |
| T12.3 | docs/RUNBOOK.md | P0 | ☑ | T12.1 |
| T12.4 | Final audit: tracker bump, README deployment section | P1 | ☑ | T12.2, T12.3 |

> **T12.1 / T12.2 correction.** Both were marked ☑, but neither artifact was ever committed —
> `git log --all -- apps/server/Dockerfile` and `-- docker-compose.prod.yml` are both empty, and
> commit `ddca14e` records that "its documented RUNBOOK/CLAUDE.md contract doesn't exist in the tree."
> They are now **⊘ superseded**: Render builds from source, so no image is needed, and
> `packages/db/docker-compose.yml` remains local-dev only.
>
> **T12.3 / T12.4.** RUNBOOK.md existed but documented the phantom Docker stack and a CI workflow that
> was also absent; rewritten 2026-08-14 around the real target. T12.4's "README deployment section"
> had no README to live in — `README.md` now exists and links to the runbook.

## M13 — Optimization (1/1)

Behavior-preserving performance pass off a frontend/backend/deps audit — no rewrite. Runtime
(query caching, projected authz gate, map redraw) + hygiene (lucide dedup, CI double-build).

| Task | Title | Pri | Status | Depends on |
|---|---|:--:|:--:|---|
| T13.1 | Performance optimization pass (behavior-preserving) | P2 | ☑ | — |
