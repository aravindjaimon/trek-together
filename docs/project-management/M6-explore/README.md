# M6 — Explore (routes near me)

> Ship the geospatial discovery query and prove the 2dsphere index pays off — the report's secondary benchmark.

## Why this milestone

This is the headline geospatial feature of a backend-graded capstone: a real `$geoNear` query over
GeoJSON with a `2dsphere` index, run through the data layer's raw-Mongo helpers (PRD FR-7, PROJECT-SPEC.md
§3/§6/§9). The on/off index benchmark turns the indexing design into measured evidence (NFR-P4).

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T6.1](./t6-1-geonear-explore-query-aggregateraw-data-layer.md) | $geoNear explore query (aggregateRaw, data layer) | P0 | 1d | T4.2 |
| [T6.2](./t6-2-routesexplore-procedure-paginated-capped-limit.md) | routes.explore procedure (paginated, capped limit) | P0 | 0.5d | T6.1 |
| [T6.3](./t6-3-index-on-off-benchmark-with-explain.md) | Index on/off benchmark with explain() | P0 | 1d | T6.1 |
| [T6.4](./t6-4-explore-tests-plan-verification.md) | Explore tests + plan verification | P1 | 0.5d | T6.2 |

## Entry criteria (what must be true before starting)

- M4 done: routes persist with GeoJSON `path`; `2dsphere` setup script available (T4.2).

## Exit criteria (milestone is done when…)

- `routes.explore` returns nearby public routes ordered by distance, paginated and capped.
- `docs/benchmarks/index.md` documents with/without-index timings + `explain()` plans.
- Tests verify correctness and that the geo index is used.

## WOOLF report artifacts produced here

- *Database Schema Design* / *Feature Development Process* — geo query + measured index benefit (NFR-P4).
- *Conclusion* — results.
