# Benchmarks (T9.7)

Consolidated performance evidence for the report. Both benchmarks run against a live MongoDB and record
their own dated results; re-run to refresh.

## 1. Elevation cache — cold vs. warm ([`cache.md`](./cache.md))

The headline optimisation (PROJECT-SPEC §9, PRD NFR-P3). `routes.analyze` is run cold (empty
`elevationCache`, every point a rate-limited provider fetch) then warm (populated cache, zero provider
calls).

| Scenario | Latency | Cache |
|---|---|---|
| Cold (empty cache) | ~575 ms | all misses |
| Warm p50 | ~2.4 ms | ~100 % hit ratio |

**~241× faster warm**, converting a rate-limited multi-second cold analysis into a sub-millisecond
per-point warm one. Cold cost scales with route length × provider rate limit (≤1 req/s, ≤100 pts/batch),
not CPU.

Re-run: `pnpm db:start && pnpm -F server bench:analyze`

## 2. `$geoNear` explore — 2dsphere index on/off ([`explore.md`](./explore.md))

2000 public routes seeded; explore query within 25 km. Because `$geoNear` mandates a 2dsphere index, the
on/off contrast uses the equivalent `$geoWithin`/`$centerSphere` filter via `explain(executionStats)`; the
production `$geoNear` plan is then verified.

| Scenario | Index used | Docs examined | p50 |
|---|---|---|---|
| 2dsphere **ON** | `path_2dsphere` | ~204 | ~2.1 ms |
| 2dsphere **OFF** | `isPublic` fallback | 2000 (full scan) | ~3.5 ms |

The geo index turns an O(n) post-filter into an index seek — **docs-examined** is the durable signal
(204 vs 2000; the gap grows linearly with collection size). Production `routes.explore` plan verified as
`GEO_NEAR_2DSPHERE`.

Re-run: `pnpm db:start && pnpm -F server bench:explore`

## Known limit: elevation provider quota (T10.6)

The public OpenTopoData host allows ~1 req/s and **~1000 calls/day per IP** — roughly 100–200 cold
route analyses per day across all users. The server enforces this locally (process-global 1 req/s
chain, retry-once on 429, daily circuit breaker via `OPENTOPODATA_DAILY_LIMIT`); at the ceiling,
cold analyses degrade to a typed `ELEVATION_UNAVAILABLE` until the UTC day rolls over. Warm (cached)
analyses are unaffected — see `docs/decisions/elevation-quota.md`.

## Method notes
- Latencies are machine/network/Mongo-version dependent; treat ratios and docs-examined as the signal.
- Both scripts live under `apps/server/scripts/` and are **not** part of `pnpm test` (they need a live DB).
