# T2.1 — Geo utils: haversine + polyline densification

> Provide pure functions for great-circle distance and for resampling a polyline to ~30–90 m spacing.

| Field | Value |
|---|---|
| **Task ID** | T2.1 |
| **Milestone** | M2 — Analysis math |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T0.2 |
| **Blocks** | T2.2, T2.5 |
| **Labels** | domain, geo |

## Context & rationale
Before sampling elevation, the route polyline must be densified to roughly one point every ~30–90 m so
climbs aren't missed and quota isn't wasted (PRD §9, PROJECT-SPEC.md §5.1). All domain math is **pure,
SI-unit (metres), unit-tested** TypeScript in `services/` (PROJECT-SPEC.md §5/§11).

## Spec references
- PROJECT-SPEC.md §5.1 (densify ~30–90 m), §11 (SI internal)
- PRD §9 (elevation sampling)

## Implementation steps
1. Create `apps/server/src/services/geo.ts`.
2. `haversineM(a: LatLng, b: LatLng): number` — great-circle distance in metres.
3. `densify(path: LatLng[], spacingM = 60): LatLng[]` — walk each segment and insert interpolated points so consecutive spacing ≤ `spacingM`; preserve original vertices and order; carry cumulative `distanceAlongM`.
4. Handle degenerate input (single point, zero-length segments, duplicate consecutive points).
5. Keep spacing configurable (default to match the dataset resolution; ~30 m for `srtm30m`).

## Acceptance criteria
- [ ] `haversineM` matches known distances within tolerance (e.g. 1° latitude ≈ 111.2 km).
- [ ] `densify` yields consecutive spacing ≤ target and retains endpoints/order.
- [ ] Degenerate inputs handled without throwing.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Covered by fixtures shared with T2.8.

## Files & paths
- `apps/server/src/services/geo.ts`

## WOOLF report mapping
- *Feature Development Process* — first step of the `routes.analyze` pipeline.

## References
- Haversine formula — https://en.wikipedia.org/wiki/Haversine_formula

## Suggested commit(s)
- `feat(geo): haversine distance + polyline densification`
