# T10.1 — Snap procedure tests (snap.test.ts + vertex-cap coverage)

> `routes.snap` landed (4014963) with provider-client tests only; add procedure-level coverage and
> pin the MAX_VERTICES 500→3000 bump's safety story.

| Field | Value |
|---|---|
| **Task ID** | T10.1 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.25d |
| **Depends on** | — |
| **Blocks** | T10.2 |
| **Labels** | api, tests, routing |

## Context & rationale
The snap backend shipped with `mapbox.test.ts` (client) but nothing over the oRPC boundary, and the
analyze vertex cap was raised 6× to accept full-resolution snapped geometry — both changes were
untested at the procedure level.

## Implementation steps
1. `packages/api/src/routers/routes/snap.test.ts` mirroring `analyze.test.ts` (ephemeral HTTP server,
   `vi.mock` of both default-services so no env/network).
2. Cover: happy path, `RouteNotFoundError`→ROUTING_UNAVAILABLE, `RoutingProviderError`
   (missing token)→ROUTING_UNAVAILABLE, unexpected-error detail never leaks, <2 and >25 waypoints →
   BAD_REQUEST.
3. In `analyze.test.ts`: 3000-vertex path accepted; long sparse route still rejected by `guardSize`
   (VALIDATION) — the vertex cap can't be gamed by distance.

## Acceptance criteria
- [x] All snap procedure error paths asserted over HTTP with typed codes.
- [x] MAX_VERTICES bump justified by tests (accept dense, reject oversized).
- [x] Suites offline: no env, Mongo, or network.

## Definition of Done
- [x] Layering rules respected (PROJECT-SPEC.md §3).
- [x] `pnpm check-types` and `pnpm lint` pass.
- [x] `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/routers/routes/snap.test.ts` (new)
- `packages/api/src/routers/routes/analyze.test.ts`

## Suggested commit(s)
- `test(routes): snap procedure suite + vertex-cap/guardSize coverage`
