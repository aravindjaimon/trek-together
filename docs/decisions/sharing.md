# Decision — Share-by-link (public routes)

**Status:** accepted · **Milestone:** M5 (T5.1) · **Spec:** PRD FR-6, §5 (Viewer), A3 · PROJECT-SPEC §7

## Decision
A share link is just a **public route reachable by its id** — no token, no expiry, no separate share
entity (Assumption A3). Sharing is toggled by the `Route.isPublic` flag (owner-only, via `routes.update`).

## Share URL shape (frontend contract)
`/r/:id` — the public viewer route in the web app (T7.7). `:id` is the Mongo ObjectId (24-hex). The page
loads the route with `routes.getById({ id })` as an **anonymous** caller.

## Access rules (server — `routes.getById`, `routes.exportItinerary`)
Resolved by the shared `findVisibleRoute` gate:
- `isPublic === true` → visible to **anyone**, including anonymous callers.
- private → visible only to the **owner** (matched on session user id).
- missing **or** someone-else's-private → uniform **`NOT_FOUND`**, so a private route's existence never
  leaks (PRD NFR-S2).

## Viewer payload
`getById` returns the complete route: `path` (GeoJSON), `elevationProfile`, `distanceM`, `ascentM`,
`descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`, `difficultyBand`, `name`,
`description`, `isPublic`. Enough for the map, the profile chart, the difficulty badge, and the
time/ascent summary with **no** extra round-trips.

## Deferred
- Route thumbnails / OpenGraph preview images (PRD open question) — future work.
- Revocable / expiring share tokens — not needed for the capstone scope (A3).
