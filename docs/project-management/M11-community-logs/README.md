# M11 — Community Trek Logs

> The `PROJECT-SPEC.md §5.6` community layer, brought into scope by Trail-Ready v1.0: authenticated
> users log completed treks (date, actual duration, 1–5 rating, notes) per route, aggregated into
> per-route stats (log count, average rating, typical actual vs. predicted time).

Design decisions — schema (referenced not related; denormalized `userName`; no unique constraint),
aggregation (stats inside `logs.listForRoute` via `aggregateRaw`), and authz (reuse
`findVisibleRoute`) — are recorded in [`../../decisions/trek-logs.md`](../../decisions/trek-logs.md).
Keeps the CLAUDE.md layering: thin procedures → pure/authz logic → data layer owns Mongo.

## Tasks

| Task | Title | Pri | Est |
|---|---|:--:|:--:|
| T11.1 | Docs reconciliation (PRD/SPEC: snap + logs in scope, API tables) | P0 | 0.25d |
| T11.2 | TrekLog Prisma model + db push | P0 | 0.25d |
| T11.3 | Logs repo (create, listForRoute, statsForRoute) | P0 | 0.5d |
| T11.4 | `logs.create` + `logs.listForRoute` procedures | P0 | 0.5d |
| T11.5 | Logs integration tests | P0 | 0.5d |
| T11.6 | Trek logs UI on `/r/:id` (stats line, list, form) | P1 | 0.5d |
| T11.7 | OpenAPI re-export + tracker close-out | P2 | 0.25d |

Statuses live in each task file and [`../TRACKER.md`](../TRACKER.md).
