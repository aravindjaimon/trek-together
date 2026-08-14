# T5.2 — GPX export builder

> Serialize a route to valid GPX (track geometry + waypoints) usable by standard GPS/hiking apps offline.

| Field | Value |
|---|---|
| **Task ID** | T5.2 |
| **Milestone** | M5 — Share + export |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T4.3 |
| **Blocks** | T5.4 |
| **Labels** | export, offline |

## Context & rationale
FR-8: offline-usable itineraries. GPX is the interoperable standard for routes/tracks. Because all
derived values are precomputed, the export needs no network (PRD §5.5/§8).

## Spec references
- PRD FR-8, §5.5
- PROJECT-SPEC.md §5.5

## Implementation steps
1. Create `apps/server/src/services/export/gpx.ts` exporting `toGpx(route): string`.
2. Emit a valid GPX 1.1 document: `<trk><trkseg>` from `path` coordinates; optional `<wpt>` for notable points; metadata (name, description).
3. Include elevation on track points where available (from the embedded profile).
4. Validate against the GPX schema / round-trip in a hiking app or a GPX validator.
5. Keep it pure (route in → string out) for easy testing.

## Acceptance criteria
- [ ] Output is schema-valid GPX and opens in a standard GPS app.
- [ ] Track geometry + elevations present; metadata included.
- [ ] Pure function; unit-tested.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/export/gpx.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-8) · *Technologies Used*.

## References
- GPX 1.1 — https://www.topografix.com/gpx.asp

## Suggested commit(s)
- `feat(export): gpx itinerary builder`
