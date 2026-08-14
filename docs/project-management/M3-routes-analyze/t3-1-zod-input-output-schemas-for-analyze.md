# T3.1 — Zod input/output schemas for analyze

> Define the Zod input (polyline + options) and output (profile, metrics, time, grade) contracts for routes.analyze.

| Field | Value |
|---|---|
| **Task ID** | T3.1 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.6 |
| **Blocks** | T3.3 |
| **Labels** | api, validation |

## Context & rationale
Every oRPC input is validated with Zod at the boundary (PRD NFR-S1, PROJECT-SPEC.md §7/§11). Defining the
analyze contract first lets the procedure stay thin and gives the client end-to-end types for free.

## Spec references
- PROJECT-SPEC.md §7 (Zod in/out), §11
- PRD FR-3 (response fields), NFR-S1

## Implementation steps
1. Create `apps/server/src/routers/routes/analyze.schema.ts`.
2. **Input:** `path: [{ lat, lng }]` (≥2 points, lat ∈ [−90,90], lng ∈ [−180,180]), optional `spacingM`.
3. **Output:** `elevationProfile: [{ distanceAlongM, elevationM }]`, `distanceM`, `ascentM`, `descentM`, `estTimeNaismithS`, `estTimeToblerS`, `difficultyScore`, `difficultyBand`.
4. Constrain sizes (max vertices, max densified points) to protect quota and latency.
5. Export inferred TS types for the service and client.

## Acceptance criteria
- [ ] Invalid coordinates / <2 points / oversized payloads are rejected with typed validation errors.
- [ ] Output schema matches FR-3 exactly.
- [ ] Inferred types are reused by the service (no duplicate shapes).

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/analyze.schema.ts`

## WOOLF report mapping
- *Feature Development Process* — the typed payload of the flagship feature.

## References
- Zod — https://zod.dev/ · oRPC — https://orpc.unnoq.com/

## Suggested commit(s)
- `feat(routes): zod schemas for routes.analyze`
