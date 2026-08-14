# M8 — PWA & offline

> Make the app installable and able to serve a previously viewed/saved itinerary with no network.

## Why this milestone

Offline-on-the-trail is a real user need and a stated requirement (PRD FR-8/NFR-U1, §5.5). Because
analyses are precomputed and exportable, the PWA mostly needs the right caching strategy: precache the
shell, runtime-cache itineraries, and respect the OSM tile policy. The verification step turns the
offline claim into report evidence.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T8.1](./t8-1-pwa-manifest-install-vite-plugin-pwa.md) | PWA manifest + install (vite-plugin-pwa) | P1 | 0.5d | T7.1 |
| [T8.2](./t8-2-service-worker-app-shell-precache.md) | Service worker app-shell precache | P1 | 0.5d | T8.1 |
| [T8.3](./t8-3-runtime-caching-of-itineraries-osm-tile-policy.md) | Runtime caching of itineraries + OSM tile policy | P1 | 1d | T8.2, T7.7 |
| [T8.4](./t8-4-offline-verification.md) | Offline verification | P1 | 0.5d | T8.3 |

## Entry criteria (what must be true before starting)

- Frontend (M7) functional, esp. the public route view (T7.7) and the map (T7.3).

## Exit criteria (milestone is done when…)

- App installs as a PWA; shell loads offline.
- A previously viewed route opens offline; tile cache is bounded and policy-respecting.
- Offline behaviour verified (Lighthouse + manual) with evidence in `docs/`.

## WOOLF report artifacts produced here

- *Technologies Used* (PWA) · *Requirement Gathering* (FR-8) · *Conclusion* (offline + limitations).
