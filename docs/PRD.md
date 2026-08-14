# Trek Together — Product Requirements Document

| | |
|---|---|
| **Project** | Trek Together — trek route planner, difficulty grader & shareable itinerary app |
| **Author** | AJ (Aravind Jaimon) |
| **Status** | Draft v0.1 |
| **Date** | 2026-06-22 |
| **Context** | Capstone Project — Scaler Neovarsity / Woolf, MSc Computer Science (Backend Specialization). Supervisor: Naman Bhalla. |
| **Related** | `CLAUDE.md` (engineering guide), WOOLF report template (repo root) |

---

## 1. Summary

Trek Together lets a hiker plot a trail on a map and instantly get a trustworthy analysis of it: an
elevation profile, total ascent/descent, an estimated walking time, and a difficulty grade — all
computed from real elevation data. A planned route can be saved, shared by link for anyone to view,
exported as a GPX/JSON itinerary for offline use on the trail, and discovered by other users via a
"routes near me" map search.

It is deliberately a **small, focused application**. Its purpose is to satisfy the Scaler/Woolf
backend capstone by demonstrating real backend depth — geospatial document schema design, a typed
end-to-end API, and a *measurable* caching/indexing optimization — without becoming a long-lived
product.

## 2. Background & motivation

The name is borrowed from a real trekking community ("Trek Together") that the author hikes with. The
app is a lightweight digital companion to that experience: plan a trek, see how hard it is and how
long it will take, and share it with the group.

The **driving motivation is academic**. This is a graded, individual capstone judged on backend
engineering — not on product breadth. The design therefore optimizes for *demonstrable depth in a
few areas* rather than feature count:

- **Geospatial backend** — GeoJSON route geometry with MongoDB `2dsphere` indexes and `$geoNear` queries.
- **Typed API flow** — oRPC procedures with Zod validation, end-to-end type safety.
- **A headline optimization** — caching expensive, rate-limited elevation API calls, measured cold vs. warm.

Build is **iterative with frequent, dated commits**; the commit history is itself evidence of genuine work.

## 3. Problem statement

Planning a trek today means juggling disconnected tools: a map to trace the route, a separate service
to look up elevation, a manual guess at how difficult it is, and a back-of-envelope time estimate.
The numbers are inconsistent, hard to reproduce, and impossible to share cleanly. Trek Together
collapses that into one flow — **plot → analyze → save → share** — with transparent, citable math and
offline-ready output.

## 4. Goals & non-goals

### Goals

- **G1** — Turn a hand-drawn route into a transparent, reproducible analysis: elevation profile,
  ascent/descent, time estimate, and a difficulty grade, using documented and citable formulas.
- **G2** — Keep analysis fast and quota-safe despite rate-limited elevation APIs, via a measurable
  elevation cache (the report's headline optimization).
- **G3** — Let users save routes and share them by link so anyone (no account) can view and consume them.
- **G4** — Let routes be discovered by location ("routes near me") using a real geospatial query and index.
- **G5** — Produce offline-usable itineraries (GPX/JSON export + installable PWA).
- **G6** — Demonstrate clean, layered, type-safe backend architecture suitable for the capstone report.
- **G7** — Snap plotted waypoints onto real walking paths so the drawn line, its analysis, and its
  export follow actual trails, not straight chords (optional-token integration; falls back to a
  straight line when unconfigured or when no path is found).
- **G8** — Let users log completed treks (date, actual duration, rating, notes) per route and surface
  per-route aggregate stats (log count, average rating, typical actual vs. predicted time) — the
  SPEC §5.6 community layer.

### Non-goals (v1)

- Turn-by-turn live navigation or on-trail GPS tracking — this is a *planner*, not a nav app.
- Ratings-driven ranking, comments/threads, or a social graph (following, feeds) — trek logs are
  per-route entries and aggregate stats only, not a social network.
- Group/collaborative trip planning, invites, or shared editing.
- Real-time weather, permits, bookings, or payments.
- Native iOS/Android apps (the PWA covers installability and offline).

> **Scope change (2026-07-11, Trail-Ready v1.0):** snap-to-trail routing (G7) and community
> trek-logging (G8) were v1 non-goals in the original PRD; both are now in scope. G8 reconciles the
> PRD with `PROJECT-SPEC.md §5.6/§6/§7`, which always specified the community layer.

## 5. Personas & actors

Just two actors, by design.

- **User (authenticated).** Plots routes (snapped to real trails), runs analysis, saves routes, shares
  them, browses public routes near a location, and logs completed treks on any route they can see.
  Owns their routes and can edit/delete them.
- **Viewer (anonymous, has a link).** Opens a shared route, reads its map, elevation profile,
  difficulty and time, its community logs and aggregate stats, and exports the itinerary. Read-only;
  no account required.

> An admin/moderator role is explicitly out of scope.

## 6. User stories

**User**

- As a User, I can register and sign in so my routes are saved to my account.
- As a User, I can plot a route by clicking points on a map and see the line update live.
- As a User, I can analyze a plotted route and see its elevation profile, total ascent/descent,
  estimated time (Naismith and Tobler), and difficulty grade.
- As a User, I can save a route with a name and description, and mark it public or private.
- As a User, I can copy a share link for a route and send it to anyone.
- As a User, I can browse public routes near a chosen location on a map.
- As a User, I can export any of my routes as GPX or JSON.
- As a User, my plotted waypoints snap onto real walking paths, and planning still works (straight
  line) if snapping is unavailable.
- As a User, I can log a completed trek on a route I can see — recording the date, how long it
  actually took, a 1–5 rating, and notes.

**Viewer**

- As a Viewer, I can open a shared link and view the route, its profile, difficulty and time — without
  signing in.
- As a Viewer, I can read a route's community logs and its aggregate stats (log count, average
  rating, typical actual vs. predicted time) without signing in.
- As a Viewer, I can export the shared itinerary as GPX/JSON to use offline.

*(These map directly to the use-case diagram required in the report's Requirement Gathering section.)*

## 7. Scope

### In scope (v1)

Authentication · manual route plotting · trail snapping (`routes.snap`) · `routes.analyze` (elevation
→ ascent/descent → time → difficulty) · elevation caching · save/manage routes · share-by-link public
view · explore "routes near me" (`$geoNear`) · community trek logs + per-route stats (`logs.*`) ·
offline GPX/JSON export · installable PWA.

### Out of scope (v1)

Everything in §4 Non-goals. Tracked as Future Work (§15).

## 8. Functional requirements

Each requirement has acceptance criteria (AC).

**FR-1 — Authentication.** Email/password auth with sessions via Better-Auth (Prisma adapter).
*AC:* a user can register, log in, and log out; write/owned-data procedures reject unauthenticated
requests; sessions persist across reloads.

**FR-2 — Route plotting.** The user builds a route as an ordered polyline of `(lat, lng)` vertices on
a Leaflet/OSM map.
*AC:* clicking adds vertices; the line and a running distance update live; vertices can be removed; the
geometry is captured as a GeoJSON `LineString`.

**FR-3 — Route analysis (`routes.analyze`) — flagship.** Given a polyline, return an elevation profile,
total ascent and descent (metres), estimated time (Naismith **and** Tobler), and a difficulty score +
band.
*AC:* the polyline is densified to ~30–90 m spacing; sample points are looked up (cache-first); the
response includes `elevationProfile[]`, `ascentM`, `descentM`, `distanceM`, `estTimeNaismithS`,
`estTimeToblerS`, `difficultyScore`, `difficultyBand`; all inputs validated with Zod.

**FR-4 — Elevation caching.** Every sampled point is cached in a Mongo `elevationCache` collection
keyed by quantized coordinates; analysis is cache-first and only calls the elevation API for misses.
*AC:* a unique index on the quantized key; a TTL index on `fetchedAt`; outbound calls are batched
(≤100 points/request) and rate-limited (≤1 req/s); a repeated analysis of the same route serves
entirely from cache; cold vs. warm latency is measurable.

**FR-5 — Save & manage routes.** A User can save, list, view, edit, and delete their own routes, and
set `isPublic`.
*AC:* a saved route persists all derived analysis fields; only the owner can edit/delete; list is
paginated.

**FR-6 — Share by link / public view.** A public route is viewable by anyone via a stable link without
authentication.
*AC:* `routes.getById` returns a public route to an anonymous caller; private routes are not exposed;
the viewer sees map, profile, difficulty and time.

**FR-7 — Explore "routes near me".** A list of public routes near a chosen point, sorted by distance,
backed by a `2dsphere` index and `$geoNear`.
*AC:* given a location and radius, returns nearby public routes ordered by proximity; query plan uses
the geospatial index (verifiable via `explain("executionStats")`); paginated; capped `limit`.

**FR-8 — Offline export + PWA.** Export a route as GPX or JSON; the app is an installable PWA that
caches the shell and viewed/saved itineraries for offline use.
*AC:* `routes.exportItinerary` returns valid GPX and JSON containing geometry, profile, distance,
ascent/descent, time and difficulty; the exported file needs no network to open; the PWA installs and
serves a previously viewed itinerary offline.

**FR-9 — Trail snapping (`routes.snap`).** Snap ordered clicked waypoints onto real walking paths.
*AC:* given 2–25 waypoints, returns the snapped geometry following real paths; a missing provider
token or no walkable route surfaces as a typed `ROUTING_UNAVAILABLE` and the client falls back to a
straight line so planning always works.

**FR-10 — Community trek logs (`logs.*`).** An authenticated User can log a completed trek on any
route they can see; anyone who can see a route can read its logs and aggregate stats.
*AC:* `logs.create` (auth) records `completedOn` (not in the future), `actualDurationS`
(0 < d ≤ 7 days), a 1–5 integer rating, and optional notes (≤2000 chars), rejecting a log on a route
the caller can't see with `NOT_FOUND`; `logs.listForRoute` returns paginated newest-first logs plus
`{ count, avgRating, avgActualDurationS }`, and is readable anonymously for a public route.

## 9. Domain logic & algorithms

All algorithms are pure, unit-tested TypeScript in the service layer. **Internal units are SI
(metres, seconds); convert only at the API/UI boundary.**

- **Elevation sampling (§5.1).** Densify the polyline to ~30–90 m spacing (match dataset resolution),
  batch sample points (≤100/request), cache each. Output: ordered `(distanceAlongM, elevationM)`.
- **Ascent / descent (§5.2).** `ascent = Σ max(0, eₙ − eₙ₋₁)`, `descent = Σ max(0, eₙ₋₁ − eₙ)`. Apply
  light smoothing / a ~3–5 m minimum-change threshold first to avoid SRTM noise inflating the totals.
  The chosen smoothing is documented because it affects the grade.
- **Time — Naismith (baseline).** 1 h per 5 km + 1 h per 600 m ascent.
- **Time — Tobler (refinement).** `W = 6·exp(−3.5·|S + 0.05|)` km/h with `S = Δelev/Δhoriz`, integrated
  per profile segment. Both estimates are stored and surfaced.
- **Difficulty — Shenandoah NPS rating.** `difficulty = sqrt(2 × elevationGain × distance)` on the NPS
  unit basis (**gain in feet, distance in miles**), classified into Easiest / Moderate / Moderately
  strenuous / Strenuous / Very strenuous. The score is computed by converting the SI internals at the
  grading boundary; both the numeric `difficultyScore` and the `difficultyBand` label are stored. *(See
  Assumption A1.)*

## 10. Non-functional requirements

- **NFR-P1 — Warm analysis latency.** With all points cached, `routes.analyze` should return quickly
  (target p95 < ~300 ms; to be validated by measurement).
- **NFR-P2 — Cold analysis.** Cold latency is bounded by the elevation API (batched + rate-limited);
  the cold figure is recorded, not hidden.
- **NFR-P3 — Headline optimization.** Cache hit ratio and cold-vs-warm latency are measured and
  reported — the report's primary benchmark.
- **NFR-P4 — Index benchmark.** The `$geoNear` explore query is benchmarked with vs. without the
  `2dsphere` index via `explain("executionStats")` — the secondary benchmark.
- **NFR-S1 — Input validation.** Every oRPC input is validated with Zod; raw Mongo geo commands never
  string-concatenate user input.
- **NFR-S2 — AuthZ.** Writes and owned-data reads require a valid session; only `isPublic` routes are
  exposed anonymously.
- **NFR-S3 — Secrets & quotas.** No secrets in the repo (only `.env.example`); elevation calls always
  go through the cache wrapper and respect provider quotas; OSM tile usage policy honored
  (User-Agent + attribution).
- **NFR-R1 — Graceful degradation.** Elevation API failures fall back to the secondary provider and/or
  served cache; uncacheable failures return a clear typed error.
- **NFR-R2 — Replica set.** Local MongoDB runs as a single-node replica set (required by Prisma).
- **NFR-U1 — Offline.** PWA installable; service worker caches app shell + viewed/saved itineraries.
- **NFR-M1 — Maintainability.** Strict TypeScript, layered architecture (§12), unit tests on domain
  math with known fixtures.

## 11. Data model (high level)

Document-oriented; MongoDB via Prisma (`provider = "mongodb"`). Final ER/collection diagram lives in
`docs/diagrams/`.

- **`user` / `session` / `account` / `verification`** — managed by Better-Auth. `user` is the identity root.
- **`routes`** — `id`, `ownerId → user` *(reference)*, `name`, `description`, `path` (GeoJSON
  `LineString`), `elevationProfile[]` *(embedded `{ distanceAlongM, elevationM }`)*, `distanceM`,
  `ascentM`, `descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`, `difficultyBand`,
  `isPublic`, `createdAt`, `updatedAt`.
- **`elevationCache`** — quantized `(lat,lng)` key *(unique index)* → `elevationM`, `dataset`,
  `fetchedAt` *(TTL index)*.

**Design talking points (for the schema section):** the elevation profile is *embedded* in the route
(read together, bounded size); the owner is *referenced* (independent lifecycle). Indexes: `2dsphere`
on `routes.path`; standard indexes on `ownerId` and `isPublic`.

## 12. API surface (oRPC) & architecture

Thin oRPC procedures (Zod in → typed out) → services (domain logic) → data/repositories (all Prisma +
raw Mongo geo) → integrations (elevation client + cache). One consistent typed error shape; centralized
Express error handling. Geospatial queries (`$geoNear`) run via `aggregateRaw`/`$runCommandRaw` in the
data layer.

| Procedure | Auth | Purpose |
|---|---|---|
| `auth.*` | — | register / login / session / logout (Better-Auth) |
| `routes.snap` | optional | snap ≤25 waypoints onto real walking paths (Mapbox) |
| `routes.analyze` | optional | polyline → profile, ascent/descent, time, grade (flagship) |
| `routes.create` | required | save a planned route |
| `routes.getById` | public if `isPublic` | shared/public route view |
| `routes.listMine` | required | the user's own routes (paginated) |
| `routes.update` | required (owner) | edit a route's name/description/visibility |
| `routes.delete` | required (owner) | delete a route (registered as `routes.remove`) |
| `routes.explore` | optional | public routes near a point (`$geoNear`, paginated) |
| `routes.exportItinerary` | matches route visibility | GPX or JSON export |
| `logs.create` | required | log a completed trek on a visible route |
| `logs.listForRoute` | matches route visibility | paginated logs + aggregate stats for a route |

oRPC is OpenAPI-compatible — a spec is exported to `docs/api/` for the report.

## 13. Success metrics

- **Technical (primary).** Cold vs. warm `routes.analyze` latency and cache hit ratio (NFR-P3);
  `$geoNear` query time and plan with vs. without the `2dsphere` index (NFR-P4). Numbers captured in
  `docs/` as they are produced.
- **Functional.** The end-to-end loop works: a User can plot → analyze → save → share, a Viewer can
  open the link → view → export — with no account.
- **Quality.** Domain math (ascent/descent, Naismith, Tobler, difficulty) covered by unit tests against
  known fixtures; CI/type-check/lint green.

## 14. Milestones (build order for dated commits)

Ordered to produce a steady, dated commit history. Dates left to the author's schedule.

- **M0 — Scaffold.** Better-T-Stack generate, `pnpm install`, Docker Mongo (replica set), Prisma schema
  skeleton, Better-Auth wired.
- **M1 — Elevation integration + cache.** Provider client(s), cache wrapper, batching + rate limiting; unit tests.
- **M2 — Analysis math.** Sampling, smoothing, ascent/descent, Naismith, Tobler, Shenandoah grade — pure + unit-tested.
- **M3 — `routes.analyze` end-to-end.** Procedure (Zod) → service → cache; capture cold/warm benchmark.
- **M4 — Persistence.** Route schema, `db push`, `2dsphere` index setup script, `create` / `getById` / `listMine`.
- **M5 — Share + export.** Public view by link; GPX/JSON export.
- **M6 — Explore.** `routes.explore` via `$geoNear`; index on/off benchmark with `explain()`.
- **M7 — Frontend.** Map planner, elevation profile chart, difficulty badge, route view, explore map.
- **M8 — PWA & offline.** Service-worker caching of shell + itineraries; install.
- **M9 — Docs.** README, diagrams (use-case, class, ER, deployment), OpenAPI export, report artifacts.

## 15. Risks, assumptions & open questions

**Risks & mitigations**

- *Elevation API quota/latency* → mandatory caching, batching, rate limiting, secondary provider fallback.
- *SRTM noise inflating ascent* → smoothing / minimum-change threshold, documented.
- *Prisma-on-Mongo geo limits* → store GeoJSON in `Json`, create `2dsphere` outside Prisma, query via raw commands.
- *Replica-set requirement* → Docker single-node replica set for local dev.
- *OSM tile policy* → proper User-Agent + attribution; consider MapLibre if needed.

**Assumptions (confirm or correct)**

- **A1** — Difficulty uses the NPS feet+miles basis with the standard bands. (Alternative: recalibrate
  bands for metric.)
- **A2** — "Routes near me" runs `$geoNear` against the `2dsphere`-indexed route `path` (distance to the
  nearest point on the line). (Alternative: add an indexed `startPoint` Point field.)
- **A3** — A share link = a public route reachable by its id; no token/expiry. (Alternative: unlisted
  routes reachable only by a random share token.)
- **A4** — Performance targets (e.g., p95 < 300 ms warm) are provisional, to be replaced by measured numbers.

**Open questions**

- Default elevation dataset — OpenTopoData `srtm30m` (proposed)?
- Map library — Leaflet/OSM (proposed) vs. MapLibre?
- Do you want a thumbnail/static map image stored per route for nicer share previews? (Small add.)

## 16. Mapping to the WOOLF report

| Report section | Backed by (this PRD / build artifact) |
|---|---|
| Project Description | §1–§3 + a flow diagram (`docs/diagrams/`) |
| Requirement Gathering | §4–§8 (goals, personas, stories, FRs) + use-case diagram |
| Class Diagrams (LLD) | §12 routers/services/repos → draw.io |
| Database Schema Design | §11 collections, embedding vs. referencing, `2dsphere` → ER diagram |
| Feature Development Process | `routes.analyze` (FR-3/§9) + cache benchmark (NFR-P3) |
| Deployment Flow | Deployed on Render + Vercel + MongoDB Atlas (`docs/RUNBOOK.md`, `docs/decisions/hosting.md`); EC2/Beanstalk documented as the scale-up target |
| Technologies Used | §2 + §12 stack |
| Conclusion | §13 results + §15 limitations & future work |
| References | All cited formulas/APIs/libraries (CLAUDE.md §16) |
