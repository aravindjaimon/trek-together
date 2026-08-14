# T10.6 — Elevation quota hardening: global limiter, breaker, retry

> The 1 req/s limiter is created **per request** — concurrent users each get their own chain and
> collectively blow OpenTopoData's per-IP limits (1 req/s, ~1000/day) for everyone.

| Field | Value |
|---|---|
| **Task ID** | T10.6 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | — |
| **Blocks** | T10.7 |
| **Labels** | api, elevation, reliability |

## Context & rationale
`batchedLookup` builds a fresh `createRateLimiter` per call and fans batches out via `Promise.all`
— on one batch failure, already-queued batches still fire against the failed provider (pure quota
burn) and there is no retry, no `Retry-After` handling, and no daily ceiling. Scope decision: fix
app-level only; the ~1000/day ceiling stays and gets documented (no self-hosting, no paid tier).

## Implementation steps
1. `types.ts`: add `readonly name: string` to `ElevationProvider`; set in both clients + test fakes.
2. `batched-lookup.ts`: module-level `Map<string, Schedule>` keyed `${provider.name}:${minIntervalMs}`
   — all concurrent requests share one chain per provider.
3. Replace `Promise.all` with a sequential loop — first failure stops immediately.
4. Retry a failed batch **once** on 429/502/503/504 after `min(retryAfterS ?? 1.5s, 10s)`;
   carry `retryAfterS` on `ElevationProviderError`.
5. New `quota.ts`: in-memory per-provider daily counter (UTC day), env `OPENTOPODATA_DAILY_LIMIT`
   (default 1000); at the ceiling throw `ElevationProviderError` → existing fallback →
   `ElevationUnavailableError` path unchanged.
6. Docs: `docs/decisions/elevation-quota.md` + known-limit note in `docs/benchmarks/README.md`.

## Acceptance criteria
- [x] Two concurrent `batchedLookup` calls against one provider share one 1 req/s chain.
- [x] A mid-sequence batch failure fires no further primary-provider requests.
- [x] 429 with `Retry-After` retries once, then propagates typed.
- [x] Breaker trips at the daily limit and resets on UTC day change (fake timers).

## Definition of Done
- [x] Services stay DB-agnostic; no behavior change to the cache contract.
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/api/src/integrations/elevation/{batched-lookup,types,opentopodata,open-elevation}.ts`
- `packages/api/src/integrations/elevation/quota.ts` (new)
- `packages/env/src/server.ts` · `docs/decisions/elevation-quota.md` (new)

## Suggested commit(s)
- `fix(elevation): process-global rate limiter + fail-fast sequential batches`
- `feat(elevation): 429 retry-once + daily-quota circuit breaker`
