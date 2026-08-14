# PWA & Offline — verification evidence (M8)

> Evidence for T8.4. Feeds the README (T9.1) and report. Re-verifiable with the steps below.

## What was verified (browser-driven, production build)

The web app was built (`pnpm -F web build`) and served with `vite preview` on `:3001`, then driven
in Chrome. All checks passed:

| Check | Result |
|---|---|
| Service worker registers, activates, controls the page | ✅ `swActive: true`, `controlling: true` |
| App-shell precache (T8.2) | ✅ `workbox-precache-v2` — **21 entries** (831 KiB) |
| Web manifest valid + installable (T8.1) | ✅ `display: standalone`, theme/background `#0c0c0c`, icons 64/192/512 + maskable-512 |
| OSM tile runtime cache (T8.3) | ✅ `osm-tiles` cache populated (**10 tiles** after viewing one route), `CacheFirst`, bounded to 300 entries / 30 days |
| Route data offline (T8.3) | ✅ React Query cache persisted to `localStorage` (`REACT_QUERY_OFFLINE_CACHE`) — contained the viewed route's `getById` data |

## The offline test (the real one)

1. Loaded the app (SW installs, precaches the shell).
2. Opened a saved public route `/r/:id` — the map tiles and analysis loaded, populating the
   `osm-tiles` SW cache and the persisted React Query cache.
3. **Killed the API server** (`kill` the `:3000` process) to simulate having no network/backend.
4. **Reloaded the route page.** It rendered fully offline: the OSM map with the route polyline, the
   distance/ascent/descent/time summary, the difficulty badge, and the elevation-profile chart — all
   from cache, with zero reachable backend.

The only visible degradation offline: the header shows "Sign in" instead of the user, because the
session check (`/api/auth/get-session`) can't reach the server — expected, and it does not block viewing
cached public route data.

## How the pieces fit

- **App shell** — Workbox precache (generateSW), auto-updating SW (`registerType: "autoUpdate"`).
- **Map tiles** — Workbox `CacheFirst` runtime route for `*.tile.openstreetmap.org`, bounded
  (`maxEntries: 300`, `maxAgeSeconds: 30d`) to respect the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/); attribution stays in the UI.
- **Route data** — `PersistQueryClientProvider` + `createSyncStoragePersister` persist the React Query
  cache to `localStorage`, so a previously viewed route's data survives an offline reload.

## Known limitations

- **Analysing a brand-new route needs network** — uncached elevation must be fetched from the provider
  (rate-limited). Only *previously viewed* routes work fully offline.
- The **dev** server's PWA (`devOptions.enabled`) does not apply Workbox runtime caching; the offline
  behaviour above is the **production** build (`sw.js` contains the `osm-tiles` rule).
- Tiles are cached lazily (only tiles actually viewed are available offline).

## Re-run

```bash
pnpm -F web build
pnpm -F web exec vite preview --port 3001 --strictPort   # serves dist/ with the production SW
# In the browser: load the app, open a route, then go offline (DevTools → Network → Offline) and reload.
```
