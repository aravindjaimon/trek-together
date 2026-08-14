# Trek Together — Project Management Backlog

> Milestone-by-milestone task breakdown derived from [`PRD.md`](../PRD.md) and [`PROJECT-SPEC.md`](../PROJECT-SPEC.md). This folder is the single source of truth for *what to build, in what order, and how each piece is judged done*.

Each milestone is a folder; each task is its own richly detailed file (objective · context · spec refs · implementation steps · acceptance criteria · definition of done · files touched · WOOLF report mapping · references · suggested commits).

## How to use this backlog

- Work milestones in order (`M0 → M9`); within a milestone, respect each task's **Depends on**.
- Open a task file before starting it — treat its *Acceptance criteria* and *Definition of Done* as the contract.
- Update the task's **Status** field as you go and tick the checkboxes; commit that change with the work (the dated history is itself graded — PROJECT-SPEC.md §12).
- Keep benchmark numbers and diagrams in `docs/` as they are produced, not at the end (PRD §13, NFR-P3/P4).

## Legend

**Status:** ☐ Not started · ◐ In progress · ☑ Done · ⊘ Blocked

**Priority:** `P0` blocker / critical path · `P1` core feature · `P2` polish / nice-to-have

**Estimates** are ideal-time rough sizing (`d` = day) to order work, *not* deadlines (PRD §14 leaves dates to the author).

## Milestones at a glance

| # | Milestone | Tasks | Goal | PRD ref |
|---|---|---|---|---|
| M0 | [Scaffold](./M0-scaffold/) | 8 | Stand up the Better-T-Stack monorepo: install, Dockerised Mongo replica set, Prisma, Better-Auth, Express+oRPC. | PRD §14 M0 |
| M1 | [Elevation integration + cache](./M1-elevation-cache/) | 7 | Provider clients, the cache-first wrapper, batching and rate limiting — the backbone of the headline optimisation. | PRD §14 M1 · FR-4 |
| M2 | [Analysis math](./M2-analysis-math/) | 8 | Pure, unit-tested domain math: sampling, smoothing, ascent/descent, Naismith, Tobler, Shenandoah grade. | PRD §14 M2 · §9 |
| M3 | [routes.analyze end-to-end](./M3-routes-analyze/) | 6 | Wire the flagship procedure (Zod → service → cache) and capture the cold-vs-warm benchmark. | PRD §14 M3 · FR-3 |
| M4 | [Persistence](./M4-persistence/) | 8 | Route schema, 2dsphere index setup, repository, and create/getById/listMine with authz. | PRD §14 M4 · FR-5/6 |
| M5 | [Share + export](./M5-share-export/) | 5 | Public share-by-link view and GPX/JSON itinerary export. | PRD §14 M5 · FR-6/8 |
| M6 | [Explore (routes near me)](./M6-explore/) | 4 | $geoNear explore query plus the index on/off benchmark — the secondary optimisation. | PRD §14 M6 · FR-7 |
| M7 | [Frontend](./M7-frontend/) | 8 | React/TanStack map planner, profile chart, difficulty badge, route view, explore map. | PRD §14 M7 |
| M8 | [PWA & offline](./M8-pwa-offline/) | 4 | Installable PWA; service-worker caching of shell + viewed/saved itineraries. | PRD §14 M8 · FR-8 |
| M9 | [Docs & report](./M9-docs-report/) | 8 | README, diagrams, OpenAPI export, consolidated benchmarks, and the ≥40-page WOOLF report. | PRD §14 M9 · §16 |

**Total: 66 tasks across 10 milestones.**

## Full backlog

### M0 — Scaffold  ·  [folder](./M0-scaffold/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T0.1](./M0-scaffold/t0-1-generate-the-better-t-stack-scaffold.md) | Generate the Better-T-Stack scaffold | P0 | 0.5d | — |
| [T0.2](./M0-scaffold/t0-2-install-dependencies-pin-the-toolchain.md) | Install dependencies & pin the toolchain | P0 | 0.5d | T0.1 |
| [T0.3](./M0-scaffold/t0-3-provision-mongodb-docker-single-node-replica-set.md) | Provision MongoDB (Docker single-node replica set) | P0 | 0.5d | T0.1 |
| [T0.4](./M0-scaffold/t0-4-prisma-schema-skeleton-db-push-client.md) | Prisma schema skeleton + db push + client | P0 | 0.5d | T0.2, T0.3 |
| [T0.5](./M0-scaffold/t0-5-wire-better-auth-email-password-sessions.md) | Wire Better-Auth (email/password + sessions) | P0 | 1d | T0.4 |
| [T0.6](./M0-scaffold/t0-6-express-orpc-base-context-handler-health.md) | Express + oRPC base (context, handler, health) | P0 | 1d | T0.2 |
| [T0.7](./M0-scaffold/t0-7-environment-config-committed-envexample.md) | Environment config + committed .env.example | P1 | 0.5d | T0.1 |
| [T0.8](./M0-scaffold/t0-8-baseline-commit-reconcile-claudemd-4-8-green-hooks.md) | Baseline commit, reconcile PROJECT-SPEC.md §4/§8, green hooks | P1 | 0.5d | T0.1–T0.7 |

### M1 — Elevation integration + cache  ·  [folder](./M1-elevation-cache/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T1.1](./M1-elevation-cache/t1-1-opentopodata-provider-client.md) | OpenTopoData provider client | P0 | 1d | T0.6 |
| [T1.2](./M1-elevation-cache/t1-2-open-elevation-fallback-client.md) | Open-Elevation fallback client | P1 | 0.5d | T1.1 |
| [T1.3](./M1-elevation-cache/t1-3-batching-100-req-rate-limiting-1-req-s.md) | Batching (≤100/req) + rate limiting (≤1 req/s) | P0 | 1d | T1.1 |
| [T1.4](./M1-elevation-cache/t1-4-elevationcache-collection-unique-ttl-indexes.md) | elevationCache collection + unique & TTL indexes | P0 | 0.5d | T0.4 |
| [T1.5](./M1-elevation-cache/t1-5-cache-first-wrapper-quantise-write-through.md) | Cache-first wrapper (quantise, write-through) | P0 | 1d | T1.1, T1.4 |
| [T1.6](./M1-elevation-cache/t1-6-provider-fallback-graceful-degradation.md) | Provider fallback + graceful degradation | P1 | 0.5d | T1.2, T1.5 |
| [T1.7](./M1-elevation-cache/t1-7-unit-tests-client-limiter-cache-http-mocked.md) | Unit tests (client, limiter, cache; HTTP mocked) | P0 | 1d | T1.5 |

### M2 — Analysis math  ·  [folder](./M2-analysis-math/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T2.1](./M2-analysis-math/t2-1-geo-utils-haversine-polyline-densification.md) | Geo utils: haversine + polyline densification | P0 | 1d | T0.2 |
| [T2.2](./M2-analysis-math/t2-2-elevation-sampling-pipeline.md) | Elevation sampling pipeline | P0 | 1d | T1.5, T2.1 |
| [T2.3](./M2-analysis-math/t2-3-smoothing-minimum-change-threshold.md) | Smoothing / minimum-change threshold | P0 | 0.5d | T2.2 |
| [T2.4](./M2-analysis-math/t2-4-ascent-descent-computation.md) | Ascent / descent computation | P0 | 0.5d | T2.3 |
| [T2.5](./M2-analysis-math/t2-5-naismith-time-estimate.md) | Naismith time estimate | P0 | 0.5d | T2.1 |
| [T2.6](./M2-analysis-math/t2-6-tobler-time-estimate-per-segment-integration.md) | Tobler time estimate (per-segment integration) | P1 | 1d | T2.4 |
| [T2.7](./M2-analysis-math/t2-7-shenandoah-difficulty-score-band.md) | Shenandoah difficulty score + band | P0 | 0.5d | T2.4 |
| [T2.8](./M2-analysis-math/t2-8-unit-tests-against-known-fixtures.md) | Unit tests against known fixtures | P0 | 1d | T2.4–T2.7 |

### M3 — routes.analyze end-to-end  ·  [folder](./M3-routes-analyze/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T3.1](./M3-routes-analyze/t3-1-zod-input-output-schemas-for-analyze.md) | Zod input/output schemas for analyze | P0 | 0.5d | T0.6 |
| [T3.2](./M3-routes-analyze/t3-2-analysis-service-orchestration.md) | Analysis service orchestration | P0 | 1d | T1.5, T2.2–T2.7 |
| [T3.3](./M3-routes-analyze/t3-3-routesanalyze-orpc-procedure-thin.md) | routes.analyze oRPC procedure (thin) | P0 | 0.5d | T3.1, T3.2 |
| [T3.4](./M3-routes-analyze/t3-4-typed-errors-centralised-express-handling.md) | Typed errors + centralised Express handling | P0 | 0.5d | T0.6 |
| [T3.5](./M3-routes-analyze/t3-5-cold-vs-warm-cache-benchmark-harness.md) | Cold-vs-warm cache benchmark harness | P0 | 1d | T3.3 |
| [T3.6](./M3-routes-analyze/t3-6-integration-tests-supertest.md) | Integration tests (Supertest) | P0 | 1d | T3.3, T3.4 |

### M4 — Persistence  ·  [folder](./M4-persistence/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T4.1](./M4-persistence/t4-1-route-model-geojson-in-json-embedded-profile-db-push.md) | Route model (GeoJSON in Json, embedded profile) + db push | P0 | 0.5d | T0.4 |
| [T4.2](./M4-persistence/t4-2-2dsphere-index-setup-script.md) | 2dsphere index setup script | P0 | 0.5d | T4.1 |
| [T4.3](./M4-persistence/t4-3-routes-repository-data-layer.md) | Routes repository (data layer) | P0 | 1d | T4.1 |
| [T4.4](./M4-persistence/t4-4-routescreate-auth.md) | routes.create (auth) | P0 | 0.5d | T4.3, T3.3 |
| [T4.5](./M4-persistence/t4-5-routesgetbyid-public-if-ispublic.md) | routes.getById (public if isPublic) | P0 | 0.5d | T4.3 |
| [T4.6](./M4-persistence/t4-6-routeslistmine-auth-paginated.md) | routes.listMine (auth, paginated) | P0 | 0.5d | T4.3 |
| [T4.7](./M4-persistence/t4-7-authz-ownership-enforcement.md) | AuthZ + ownership enforcement | P0 | 0.5d | T4.4–T4.6 |
| [T4.8](./M4-persistence/t4-8-persistence-authz-tests.md) | Persistence + authz tests | P0 | 1d | T4.4–T4.7 |

### M5 — Share + export  ·  [folder](./M5-share-export/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T5.1](./M5-share-export/t5-1-public-share-by-link-view-anonymous-getbyid.md) | Public share-by-link view (anonymous getById) | P1 | 0.5d | T4.5 |
| [T5.2](./M5-share-export/t5-2-gpx-export-builder.md) | GPX export builder | P1 | 0.5d | T4.3 |
| [T5.3](./M5-share-export/t5-3-json-itinerary-export-builder.md) | JSON itinerary export builder | P1 | 0.5d | T4.3 |
| [T5.4](./M5-share-export/t5-4-routesexportitinerary-procedure-gpxjson.md) | routes.exportItinerary procedure (gpx|json) | P1 | 0.5d | T5.2, T5.3 |
| [T5.5](./M5-share-export/t5-5-export-anonymous-access-tests.md) | Export + anonymous-access tests | P1 | 0.5d | T5.1, T5.4 |

### M6 — Explore (routes near me)  ·  [folder](./M6-explore/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T6.1](./M6-explore/t6-1-geonear-explore-query-aggregateraw-data-layer.md) | $geoNear explore query (aggregateRaw, data layer) | P0 | 1d | T4.2 |
| [T6.2](./M6-explore/t6-2-routesexplore-procedure-paginated-capped-limit.md) | routes.explore procedure (paginated, capped limit) | P0 | 0.5d | T6.1 |
| [T6.3](./M6-explore/t6-3-index-on-off-benchmark-with-explain.md) | Index on/off benchmark with explain() | P0 | 1d | T6.1 |
| [T6.4](./M6-explore/t6-4-explore-tests-plan-verification.md) | Explore tests + plan verification | P1 | 0.5d | T6.2 |

### M7 — Frontend  ·  [folder](./M7-frontend/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T7.1](./M7-frontend/t7-1-orpc-client-auth-client-wiring.md) | oRPC client + auth-client wiring | P0 | 0.5d | T0.5, T0.6 |
| [T7.2](./M7-frontend/t7-2-auth-ui-register-login-logout-persistence.md) | Auth UI (register/login/logout, persistence) | P0 | 1d | T7.1 |
| [T7.3](./M7-frontend/t7-3-leaflet-map-route-planner.md) | Leaflet map + route planner | P0 | 1.5d | T7.1 |
| [T7.4](./M7-frontend/t7-4-analyze-action-elevation-profile-chart.md) | Analyze action + elevation profile chart | P0 | 1d | T7.3, T3.3 |
| [T7.5](./M7-frontend/t7-5-difficulty-badge-time-ascent-summary.md) | Difficulty badge + time/ascent summary | P1 | 0.5d | T7.4 |
| [T7.6](./M7-frontend/t7-6-save-form-listmine-view.md) | Save form + listMine view | P1 | 1d | T7.3, T4.4, T4.6 |
| [T7.7](./M7-frontend/t7-7-public-route-view-export-buttons.md) | Public route view + export buttons | P1 | 1d | T4.5, T5.4 |
| [T7.8](./M7-frontend/t7-8-explore-map-routes-near-me.md) | Explore map (routes near me) | P1 | 1d | T6.2 |

### M8 — PWA & offline  ·  [folder](./M8-pwa-offline/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T8.1](./M8-pwa-offline/t8-1-pwa-manifest-install-vite-plugin-pwa.md) | PWA manifest + install (vite-plugin-pwa) | P1 | 0.5d | T7.1 |
| [T8.2](./M8-pwa-offline/t8-2-service-worker-app-shell-precache.md) | Service worker app-shell precache | P1 | 0.5d | T8.1 |
| [T8.3](./M8-pwa-offline/t8-3-runtime-caching-of-itineraries-osm-tile-policy.md) | Runtime caching of itineraries + OSM tile policy | P1 | 1d | T8.2, T7.7 |
| [T8.4](./M8-pwa-offline/t8-4-offline-verification.md) | Offline verification | P1 | 0.5d | T8.3 |

### M9 — Docs & report  ·  [folder](./M9-docs-report/)

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T9.1](./M9-docs-report/t9-1-readme-setup-run-architecture-screenshots.md) | README (setup, run, architecture, screenshots) | P0 | 1d | M3–M6 |
| [T9.2](./M9-docs-report/t9-2-use-case-diagram.md) | Use-case diagram | P1 | 0.5d | — |
| [T9.3](./M9-docs-report/t9-3-class-diagram-lld.md) | Class diagram (LLD) | P1 | 1d | M3, M4 |
| [T9.4](./M9-docs-report/t9-4-er-collection-schema-diagram.md) | ER / collection schema diagram | P1 | 0.5d | M4 |
| [T9.5](./M9-docs-report/t9-5-deployment-diagram-aws-target.md) | Deployment diagram (AWS target) | P1 | 0.5d | — |
| [T9.6](./M9-docs-report/t9-6-openapi-export-to-docs-api.md) | OpenAPI export to docs/api/ | P1 | 0.5d | M3–M6 |
| [T9.7](./M9-docs-report/t9-7-consolidate-benchmark-artifacts.md) | Consolidate benchmark artifacts | P0 | 0.5d | T3.5, T6.3 |
| [T9.8](./M9-docs-report/t9-8-woolf-report-assembly-40-pp.md) | WOOLF report assembly (≥40 pp) | P0 | 3d | all |

## Critical path (P0 spine)

The shortest sequence that yields a graded, demonstrable backend. Frontend (M7) and PWA (M8) consume these but are not on the critical path for the *backend* story.

```
T0.1 → T0.2 → T0.4 → (T0.5 auth │ T0.6 server)
                         │
  T1.1 → T1.3 ┐         │
  T1.4 ───────┴→ T1.5 ──┤  (elevation cache ready)
                         │
  T2.1 → T2.2 → T2.3 → T2.4 → {T2.5, T2.6, T2.7} → T2.8
                         │
        T3.1 ┐           │
        T3.2 ┴→ T3.3 → T3.5  ★ headline cold-vs-warm benchmark
                  │
  T4.1 → T4.2 → T4.3 → {T4.4, T4.5, T4.6} → T4.7 → T4.8
                  │
        T6.1 → T6.3      ★ secondary index on/off benchmark
                  │
        T9.7 → T9.8      ★ report assembly
```

★ = a deliverable the WOOLF report is explicitly graded on (PRD §13, NFR-P3/P4).

## Requirement → task traceability (PRD §8/§10)

| Requirement | Realised by |
|---|---|
| FR-1 Authentication | T0.5, T7.2, T4.7 |
| FR-2 Route plotting | T7.3 |
| FR-3 Route analysis (flagship) | T2.1–T2.8, T3.1–T3.3, T3.6 |
| FR-4 Elevation caching | T1.3, T1.4, T1.5, T1.6, T3.5 |
| FR-5 Save & manage routes | T4.1, T4.3, T4.4, T4.6, T7.6 |
| FR-6 Share by link / public view | T4.5, T5.1, T7.7 |
| FR-7 Explore “routes near me” | T4.2, T6.1, T6.2, T6.3, T7.8 |
| FR-8 Offline export + PWA | T5.2, T5.3, T5.4, T8.1–T8.4 |
| NFR-P1/P2/P3 latency & cache | T3.5, T9.7 |
| NFR-P4 index benchmark | T6.3, T9.7 |
| NFR-S1/S2/S3 validation, authz, secrets | T3.1, T3.4, T4.7, T0.7, T1.5 |
| NFR-R1/R2 resilience & replica set | T1.6, T0.3 |
| NFR-U1 offline | T8.2, T8.3, T8.4 |
| NFR-M1 maintainability | T1.7, T2.8, T3.6, T4.8, T5.5, T6.4 |

## WOOLF report → milestone traceability (PRD §16, PROJECT-SPEC.md §13)

| Report section | Backed by |
|---|---|
| Project Description | PRD §1–§3 + flow diagram (T9.2) |
| Requirement Gathering | PRD §4–§8 + use-case diagram (T9.2) |
| Class Diagrams (LLD) | M3/M4 code → T9.3 |
| Database Schema Design | T1.4, T4.1, T4.2 → ER diagram (T9.4) |
| Feature Development Process | routes.analyze (M3) + cache benchmark (T3.5, T9.7) |
| Deployment Flow | T9.5 |
| Technologies Used | M0 stack + T9.1 |
| Conclusion | Results (T9.7) + PRD §15 limitations |
| References | Each task's *References* section + PROJECT-SPEC.md §16 |

---

_Generated from PRD.md v0.1 (2026-06-22). When scope changes, update the affected task file(s) and this index together._
