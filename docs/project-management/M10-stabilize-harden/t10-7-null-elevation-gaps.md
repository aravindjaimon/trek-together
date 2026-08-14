# T10.7 — Tolerate null-elevation gaps with coverage threshold

> One null elevation sample (ocean cell, outside SRTM's ~60°N–56°S coverage) currently throws a
> plain `Error` → generic 500 for the whole analysis. The most likely real-user crash in the app.

| Field | Value |
|---|---|
| **Task ID** | T10.7 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T10.6 |
| **Blocks** | — |
| **Labels** | api, elevation, correctness |

## Context & rationale
Dropping a null sample is mathematically identical to linear interpolation for gain/loss and Tobler
(interpolated points lie on the chord: zero added gain, identical slope), so interpolation is pure
extra code. Coastal trails with a few void cells should analyze fine; a route drawn across the sea
should fail typed with an actionable message.

## Implementation steps
1. `elevation-profile.ts`: skip `elevationM === null` samples, counting them; after the loop, if
   `profile.length < 2` **or** skipped > 20% of samples, throw typed
   `ElevationCoverageError { unresolvedCount }`.
2. Map in `analyze.ts` + `create.ts` → `VALIDATION` ("Part of this route is outside elevation data
   coverage.") — user-input problem, not a transient outage.
3. Open-Elevation returns `0` (not null) out-of-bounds — indistinguishable from sea level; document
   as a known limitation, no coercion (would corrupt coastal treks).

## Acceptance criteria
- [x] Single null mid-route → analysis succeeds minus that sample.
- [x] All-null and >20%-null routes → typed VALIDATION, never INTERNAL.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/services/elevation-profile.ts`
- `packages/api/src/routers/routes/{analyze,create}.ts`

## Suggested commit(s)
- `fix(analyze): tolerate null-elevation gaps; typed coverage error past 20%`
