# T1.2 — Open-Elevation fallback client

> Provide a secondary Open-Elevation client behind the same interface so the system can fall back when the primary fails.

| Field | Value |
|---|---|
| **Task ID** | T1.2 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T1.1 |
| **Blocks** | T1.6 |
| **Labels** | integration, elevation |

## Context & rationale
NFR-R1 requires graceful degradation: if OpenTopoData errors or is exhausted, fall back to
Open-Elevation. Implementing it behind the **same interface** as T1.1 lets the cache wrapper select a
provider without caring which one. The actual fallback wiring is T1.6.

## Spec references
- PROJECT-SPEC.md §2 (both providers, self-hostable), §16
- PRD NFR-R1, FR-4

## Implementation steps
1. Create `apps/server/src/integrations/elevation/open-elevation.ts` exporting the same
   `lookup(points): Promise<ElevationPoint[]>` shape.
2. Call `${OPEN_ELEVATION_BASE_URL}/lookup` with the `locations` payload; parse + Zod-validate to the shared type.
3. Define a common `ElevationProvider` interface both clients implement; export a `getProvider(name)` factory keyed by `ELEVATION_PROVIDER`.
4. Record `dataset`/source on each returned point so the cache can store provenance.

## Acceptance criteria
- [x] Open-Elevation client implements the shared `ElevationProvider` interface.
- [x] `getProvider()` returns the configured provider; unknown names error clearly.
- [x] Returned points carry their source/dataset.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/integrations/elevation/open-elevation.ts`
- `apps/server/src/integrations/elevation/index.ts` (provider factory + interface)

## References
- Open-Elevation — https://open-elevation.com/ (public host ~1,000 requests/month)

## Suggested commit(s)
- `feat(elevation): open-elevation fallback behind shared provider interface`
