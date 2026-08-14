# T1.6 — Provider fallback + graceful degradation

> On primary-provider failure, fall back to the secondary and/or served cache; surface a clear typed error only when uncacheable.

| Field | Value |
|---|---|
| **Task ID** | T1.6 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T1.2, T1.5 |
| **Blocks** | — |
| **Labels** | integration, resilience |

## Context & rationale
NFR-R1: elevation API failures should degrade gracefully, not crash analysis. With two providers
(T1.1/T1.2) behind one interface and a cache (T1.5), the wrapper can try primary → secondary → and
still return any cached points it has, failing loudly only when nothing can be resolved.

## Spec references
- PRD NFR-R1
- PROJECT-SPEC.md §3, §9

## Implementation steps
1. In the cache wrapper's miss path, attempt the primary provider; on error/quota, retry the miss set against the secondary.
2. If both fail, return cached points that exist and raise a typed `ELEVATION_UNAVAILABLE` error for the unresolved remainder (let the procedure decide partial vs. hard fail).
3. Log provider switches with the request id; keep messages user-safe (no stack traces — ties to T3.4).
4. Make fallback toggleable via `ELEVATION_PROVIDER`/a `fallbackEnabled` flag.

## Acceptance criteria
- [x] Simulated primary failure → secondary is used and analysis still succeeds (unit test with mocks).
- [x] Both-fail → typed `ELEVATION_UNAVAILABLE`, no raw error leaked.
- [x] Provider switch is logged with the request id.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/integrations/elevation/cache.ts` (fallback path)
- `apps/server/src/integrations/elevation/index.ts`

## WOOLF report mapping
- *Conclusion (limitations)* — resilience strategy & API-quota caveats.

## Suggested commit(s)
- `feat(elevation): provider fallback + graceful degradation`
