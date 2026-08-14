# T11.7 — OpenAPI re-export + tracker close-out

| Field | Value |
|---|---|
| **Task ID** | T11.7 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P2 |
| **Estimate** | 0.25d |
| **Depends on** | T11.4 |
| **Blocks** | — |
| **Labels** | docs, api |

## Implementation steps
1. Regenerate `docs/api/openapi.json` from the running server's `/api-reference/spec.json` so
   `logs.*` (and `routes.snap`) appear in the exported contract.
2. Update `TRACKER.md`: mark M11 rows done, bump `Last audited`.

## Acceptance criteria
- [x] `docs/api/openapi.json` includes `logs.create` and `logs.listForRoute`.
- [x] Tracker reflects M11 completion.

## Definition of Done
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `docs/api/openapi.json` · `docs/project-management/TRACKER.md`

## Suggested commit(s)
- `docs(api): regenerate OpenAPI with logs.*; close out M11`
