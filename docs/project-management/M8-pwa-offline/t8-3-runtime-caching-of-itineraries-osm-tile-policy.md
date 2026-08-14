# T8.3 — Runtime caching of itineraries + OSM tile policy

> Cache viewed/saved itineraries (and map tiles within OSM policy) so a previously seen route works offline.

| Field | Value |
|---|---|
| **Task ID** | T8.3 |
| **Milestone** | M8 — PWA & offline |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | T8.2, T7.7 |
| **Blocks** | T8.4 |
| **Labels** | frontend, pwa, offline |

## Context & rationale
FR-8: a previously viewed/saved itinerary should be usable offline. Add runtime caching for route data
and bounded, policy-respecting caching of OSM tiles (PRD §5.5, NFR-S3/U1). Don't over-cache tiles (OSM
usage policy).

## Spec references
- PRD FR-8, NFR-U1, NFR-S3 (OSM policy)
- PROJECT-SPEC.md §5.5

## Implementation steps
1. Add runtime caching (stale-while-revalidate / cache-first) for `routes.getById` + export payloads of viewed routes.
2. Cache map tiles with a **bounded** cache (max entries + expiry) to respect OSM tile policy; keep attribution.
3. Optionally let a user 'save for offline' an itinerary (store its JSON export from T5.3).
4. Verify a viewed route opens offline (map from cached tiles + cached analysis).

## Acceptance criteria
- [ ] A previously viewed route opens offline (data + tiles from cache).
- [ ] Tile cache is bounded (entries + expiry); attribution retained.
- [ ] API caching doesn't serve stale private data incorrectly.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web` SW runtime-caching config; optional 'save offline' helper

## WOOLF report mapping
- *Requirement Gathering* (FR-8) · *Conclusion* (offline strategy, OSM policy).

## References
- OSM tile policy — https://operations.osmfoundation.org/policies/tiles/

## Suggested commit(s)
- `feat(pwa): runtime caching for itineraries + bounded osm tiles`
