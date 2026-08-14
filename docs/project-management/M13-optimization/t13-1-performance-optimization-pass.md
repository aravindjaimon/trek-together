# T13.1 — Performance optimization pass (behavior-preserving)

| Field | Value |
|---|---|
| **Task ID** | T13.1 |
| **Milestone** | M13 — Optimization |
| **Status** | ☑ Done |
| **Priority** | P2 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | — |
| **Labels** | performance, refactor |

## Context
A three-part audit (frontend / backend / build+deps) confirmed the codebase is lean and
mostly correct — no rewrite warranted. This task lands the concrete, behavior-preserving
wins it surfaced. Look & feel and functionality are unchanged; the gains are runtime
(network + DB payload + map interaction) and hygiene (dependency graph + CI time), not a
sweeping refactor.

## Implementation steps
1. **Query caching** (`apps/web/src/utils/orpc.ts`) — add `defaultOptions.queries`
   (`staleTime: 60s`, `gcTime: 24h`). Stops every `routes.*`/`logs.*` query refetching on
   each navigation + window refocus (default `staleTime:0`), and lets the localStorage
   persister actually serve offline reloads instead of being evicted after 5 min.
2. **Devtools out of prod** (`apps/web/src/routes/__root.tsx`) — guard both devtools panels
   behind `import.meta.env.DEV`; the static imports become dead code and tree-shake out.
3. **Projected visibility gate** (`packages/api/src/data/routes.repo.ts`,
   `routers/routes/authz.ts`) — add `RoutesRepo.findVisibility(id)` (`select {ownerId,
   isPublic}`) + `isRouteVisible()`; route `logs.listForRoute` / `logs.create` through it so
   the gate no longer hydrates the full route (GeoJSON path + up-to-5000-pt profile) to test
   two booleans. `get-by-id`/`export` keep `findVisibleRoute` (they return the full doc).
4. **Dedup `lucide-react`** — one duplicate major was installed (`^1.8.0` in web vs
   `^0.546.0` in ui). Promote to the pnpm catalog; both packages use `catalog:`.
5. **CI double-build** (`apps/web/package.json`) — `check-types` was `vite build && tsc
   --noEmit`; drop the build (CI also runs `build`, so vite ran twice, uncached).
6. **Map/render cleanups** — memoize `explore` markers and `r.$id` geometry (stop array
   identity churn that re-ran Leaflet redraw); LeafletMap reads theme tokens once (was a
   forced sync reflow per redraw) and updates the route line via `setLatLngs` instead of
   clear-and-recreate; ElevationChart min/max via a single pass (removes `Math.min(...spread)`
   RangeError risk on long profiles).
7. **`shadcn` → devDependency** (`packages/ui/package.json`) — it's a CLI, never imported.

## Deliberately not done (audited, low ROI)
`exploreNear` two round-trips (indexed, bounded ≤100) · `upsertMany` per-row burst (cold-path
only, behind the rate-limit wait) · net-new perf tooling (Lighthouse / bundle-size CI budget /
rollup-visualizer) — add when a regression exists to catch. No re-architecture.

## Acceptance criteria
- [x] Gates green: `lint`, `check-types` (194 tests), `test` all exit 0.
- [x] Logs authz matrix still holds (public visible / private owner-only) — `logs.test.ts`
      updated to mock `findVisibility`, suite passes.
- [x] Single `lucide-react` version in the lockfile (`0.546.0`); install drops one package.
- [x] Devtools absent from the production bundle (`grep` of `dist/assets/*.js`).
- [x] Look & feel unchanged (perf edits only; no visual/markup changes).

## Results (measured)
- **Bundle:** ~872 → ~871 KB (JS+CSS). Marginal by design — the devtools libs are prod-aware
  (render null in prod) and lucide tree-shakes to only-used icons regardless of the duplicate
  *install*; the app was already lean. The lucide/shadcn wins are install-graph + drift, not bytes.
- **CI:** `check-types` no longer triggers a second `vite build` (was duplicating the `build` job).
- **Runtime (not bundle-measurable):** repeat navigations/refocus now serve from cache instead
  of refetching; the two log endpoints read two fields instead of a multi-hundred-KB route doc;
  map redraws avoid a forced reflow + full polyline teardown per edit.

## Files & paths
- FE: `apps/web/src/utils/orpc.ts` · `routes/__root.tsx` · `routes/explore.tsx` ·
  `routes/r.$id.tsx` · `components/leaflet-map.tsx` · `components/elevation-chart.tsx` ·
  `apps/web/package.json`
- BE: `packages/api/src/data/routes.repo.ts` · `routers/routes/authz.ts` ·
  `routers/logs/list-for-route.ts` · `routers/logs/create.ts` · `routers/logs/logs.test.ts`
- Deps: `pnpm-workspace.yaml` (catalog lucide) · `packages/ui/package.json`

## Suggested commit(s)
- `perf(web): cache queries, drop prod devtools, memoize map geometry`
- `perf(api): projected visibility gate for logs endpoints`
- `chore(deps): dedup lucide-react via catalog; shadcn to devDeps; drop CI double-build`
