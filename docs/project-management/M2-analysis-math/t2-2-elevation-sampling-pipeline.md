# T2.2 — Elevation sampling pipeline

> Compose densify → cache-first elevation lookup → ordered (distanceAlongM, elevationM) profile.

| Field | Value |
|---|---|
| **Task ID** | T2.2 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T1.5, T2.1 |
| **Blocks** | T2.3, T3.2 |
| **Labels** | domain, geo, elevation |

## Context & rationale
This is the bridge between the geo utils (T2.1) and the cache wrapper (T1.5): turn a raw polyline into
the **elevation profile** that every downstream calc consumes (PRD §9, PROJECT-SPEC.md §5.1). It must call
elevation only through the cache wrapper (PROJECT-SPEC.md §3).

## Spec references
- PROJECT-SPEC.md §5.1, §3
- PRD §9, FR-3

## Implementation steps
1. Create `apps/server/src/services/elevation-profile.ts` exporting `buildProfile(path): Promise<ProfilePoint[]>` where `ProfilePoint = { distanceAlongM, elevationM, lat, lng }`.
2. Densify the path (T2.1), pass the points to `getElevations()` (T1.5), and zip elevations back with cumulative distance.
3. Keep `distanceM = ` total route length available as a by-product.
4. Validate output: monotonically non-decreasing `distanceAlongM`, no `NaN` elevations.
5. Do **not** smooth here — that's T2.3 (keep stages composable and individually testable).

## Acceptance criteria
- [ ] Given a polyline, returns an ordered profile aligned to densified distance.
- [ ] Elevation comes exclusively via the cache wrapper (no direct provider calls).
- [ ] Total `distanceM` exposed; output validated (monotonic distance, finite elevations).

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/services/elevation-profile.ts`

## WOOLF report mapping
- *Feature Development Process* — core of the flagship pipeline.

## Suggested commit(s)
- `feat(analysis): elevation sampling pipeline (densify→cache→profile)`
