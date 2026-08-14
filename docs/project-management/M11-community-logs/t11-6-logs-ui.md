# T11.6 — Trek logs UI on `/r/:id` (stats line, list, form)

| Field | Value |
|---|---|
| **Task ID** | T11.6 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T11.4 |
| **Blocks** | — |
| **Labels** | web |

## Implementation steps
1. In `apps/web/src/routes/r.$id.tsx`, below the export row, a "Community logs" section:
   - **Stats line** — "Typically takes 4h 10m vs predicted 3h 40m · ★4.2 · 12 logs" via existing
     `lib/format.ts` duration helpers; hidden until there's ≥1 log.
   - **Log list** — name, date, actual duration, rating, notes; newest first.
   - **Log form** (authed users only) — `<input type="date">` (native, no picker dep), duration
     input, 1–5 rating, notes; on success invalidates the `logs.listForRoute` query.
2. Error / empty / offline states follow the M10 standards (error card, offline-aware copy).

## Acceptance criteria
- [x] Anonymous viewer sees stats + logs on a public route; no form.
- [x] Authed user can submit a log and see the list + stats update without a reload.
- [x] Empty state ("No logs yet — be the first") only on a successful empty result.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green; browser-verified end-to-end.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/r.$id.tsx` · new log-form/list components as needed

## Suggested commit(s)
- `feat(web): community trek logs on the route view (stats, list, form)`
