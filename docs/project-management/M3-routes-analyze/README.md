# M3 — routes.analyze end-to-end

> Wire the flagship procedure (Zod → service → cache) and capture the headline cold-vs-warm benchmark.

## Why this milestone

`routes.analyze` is both the product's core value and the report's feature-development deep-dive
(PRD FR-3/§16, PROJECT-SPEC.md §13). This milestone connects the M1 cache and M2 math behind a thin, typed
oRPC procedure with a consistent error shape, and turns the caching work into a measured result —
the primary thing the capstone is graded on.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T3.1](./t3-1-zod-input-output-schemas-for-analyze.md) | Zod input/output schemas for analyze | P0 | 0.5d | T0.6 |
| [T3.2](./t3-2-analysis-service-orchestration.md) | Analysis service orchestration | P0 | 1d | T1.5, T2.2–T2.7 |
| [T3.3](./t3-3-routesanalyze-orpc-procedure-thin.md) | routes.analyze oRPC procedure (thin) | P0 | 0.5d | T3.1, T3.2 |
| [T3.4](./t3-4-typed-errors-centralised-express-handling.md) | Typed errors + centralised Express handling | P0 | 0.5d | T0.6 |
| [T3.5](./t3-5-cold-vs-warm-cache-benchmark-harness.md) | Cold-vs-warm cache benchmark harness | P0 | 1d | T3.3 |
| [T3.6](./t3-6-integration-tests-supertest.md) | Integration tests (Supertest) | P0 | 1d | T3.3, T3.4 |

## Entry criteria (what must be true before starting)

- M1 cache wrapper + M2 math complete and unit-tested.
- Express + oRPC base and context available.

## Exit criteria (milestone is done when…)

- `routes.analyze` works anonymously over HTTP with full client types.
- One consistent typed error shape; no stack traces leaked.
- `docs/benchmarks/cache.md` records cold-vs-warm latency + hit ratio.
- Integration tests green offline.

## WOOLF report artifacts produced here

- *Feature Development Process* — payload → procedure → service → cache, plus the measured benchmark (NFR-P3).
- *Class Diagrams (LLD)* — procedure/service/error wiring.
