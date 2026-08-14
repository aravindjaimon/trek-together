# T1.3 — Batching (≤100/req) + rate limiting (≤1 req/s)

> Chunk lookups into ≤100-point requests and throttle outbound calls to ≤1 req/s so the public quota is never tripped.

| Field | Value |
|---|---|
| **Task ID** | T1.3 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T1.1 |
| **Blocks** | T1.5 |
| **Labels** | integration, elevation, performance |

## Context & rationale
OpenTopoData allows **100 locations/request, ~1 req/s, ~1000/day** (PROJECT-SPEC.md §9/§16). A dense route
can produce hundreds of sample points, so requests must be **batched** and **rate-limited** or the app
will be throttled or banned. This is also a core part of the optimisation narrative (FR-4, NFR-P).

## Spec references
- PROJECT-SPEC.md §9 (batch + rate-limit), §16
- PRD FR-4 (≤100/request, ≤1 req/s), §9

## Implementation steps
1. Add a `chunk(points, 100)` helper and call the provider once per chunk.
2. Add a client-side limiter (token bucket or a tiny `p-limit`/queue with ≥1s spacing) wrapping provider calls.
3. Make limits configurable (constants/env) so tests can shrink them; default to the safe public values.
4. Preserve input order in the merged result (callers rely on `(distanceAlong, elevation)` ordering).
5. Surface a clear typed error if a chunk ultimately fails after retries (retry policy optional/minimal).

## Acceptance criteria
- [x] >100 input points are split into multiple ≤100 requests.
- [x] Outbound calls are spaced ≥1s apart (verified in a timing unit test with a fake clock).
- [x] Results are returned in the original input order.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Limiter covered by a deterministic test (fake timers).

## Files & paths
- `apps/server/src/integrations/elevation/batch.ts`
- `apps/server/src/integrations/elevation/rate-limit.ts`

## WOOLF report mapping
- *Feature Development Process* / *Conclusion (limitations)* — quota handling.

## References
- OpenTopoData limits — https://www.opentopodata.org/api/

## Suggested commit(s)
- `feat(elevation): batch ≤100/req and rate-limit ≤1 req/s`
