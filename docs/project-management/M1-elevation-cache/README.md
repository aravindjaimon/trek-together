# M1 — Elevation integration + cache

> Build the provider clients and the cache-first wrapper — the backbone of the report's headline optimisation.

## Why this milestone

Every elevation read in the app flows through this layer. Because the public elevation APIs are slow
and quota-limited, caching, batching, and rate limiting are mandatory, not optional (PRD FR-4,
PROJECT-SPEC.md §9). Implementing the cache wrapper as the single choke-point now means `routes.analyze`
(M3) gets cold-vs-warm behaviour "for free", which is exactly the benchmark the report is graded on.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T1.1](./t1-1-opentopodata-provider-client.md) | OpenTopoData provider client | P0 | 1d | T0.6 |
| [T1.2](./t1-2-open-elevation-fallback-client.md) | Open-Elevation fallback client | P1 | 0.5d | T1.1 |
| [T1.3](./t1-3-batching-100-req-rate-limiting-1-req-s.md) | Batching (≤100/req) + rate limiting (≤1 req/s) | P0 | 1d | T1.1 |
| [T1.4](./t1-4-elevationcache-collection-unique-ttl-indexes.md) | elevationCache collection + unique & TTL indexes | P0 | 0.5d | T0.4 |
| [T1.5](./t1-5-cache-first-wrapper-quantise-write-through.md) | Cache-first wrapper (quantise, write-through) | P0 | 1d | T1.1, T1.4 |
| [T1.6](./t1-6-provider-fallback-graceful-degradation.md) | Provider fallback + graceful degradation | P1 | 0.5d | T1.2, T1.5 |
| [T1.7](./t1-7-unit-tests-client-limiter-cache-http-mocked.md) | Unit tests (client, limiter, cache; HTTP mocked) | P0 | 1d | T1.5 |

## Entry criteria (what must be true before starting)

- M0 complete: server boots, Prisma client + replica set available, env loader in place.

## Exit criteria (milestone is done when…)

- `getElevations()` serves cached points and only fetches misses (batched + rate-limited).
- Repeating a lookup performs zero provider calls (warm path proven by tests).
- Provider fallback works; failures degrade gracefully with typed errors.
- `pnpm test` green with no network access.

## WOOLF report artifacts produced here

- *Feature Development Process* — the cache step that `routes.analyze` depends on.
- *Database Schema Design* — `elevationCache` keying, unique + TTL indexes.
- *Conclusion (limitations)* — API quotas and resilience.
