# T11.1 — Docs reconciliation (PRD/SPEC: snap + logs in scope, API tables)

> The canonical docs contradicted each other and the code: PRD listed snap-to-trail and community
> logs as non-goals; the SPEC/PRD API tables omitted shipped procedures. Reconcile before building.

| Field | Value |
|---|---|
| **Task ID** | T11.1 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.25d |
| **Depends on** | — |
| **Blocks** | T11.2 |
| **Labels** | docs |

## Implementation steps
1. PRD §4: remove the snap-to-trail and community-trek-logging non-goal bullets; add goals G7 (snap)
   and G8 (logs) + a dated scope-change note; update §5 personas, §6 user stories, §7 scope.
2. PRD §8: add FR-9 (`routes.snap`) and FR-10 (`logs.*`) with acceptance criteria.
3. PRD §12 + SPEC §7 API tables: add `routes.snap/update/remove/explore` and `logs.create` /
   `logs.listForRoute`; note `routes.explore` supersedes the old `routes.list` sketch.
4. New `docs/decisions/trek-logs.md` recording the schema/aggregation/authz design.

## Acceptance criteria
- [x] No doc lists snap or community logs as a non-goal; the scope change is dated and cross-referenced.
- [x] Both API tables match the registered procedures.

## Definition of Done
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `docs/PRD.md` · `docs/PROJECT-SPEC.md` · `docs/decisions/trek-logs.md` (new)

## Suggested commit(s)
- `docs: reconcile PRD/SPEC — snap + community logs in scope; trek-logs decision`
