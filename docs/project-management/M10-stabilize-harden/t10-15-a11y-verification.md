# T10.15 — A11y verification pass (axe/Lighthouse + evidence)

> PRODUCT.md commits to WCAG 2.2 AA but — unlike the PWA and benchmark claims — there is zero
> verification artifact. Verify, fix quick wins, and document honestly.

| Field | Value |
|---|---|
| **Task ID** | T10.15 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T10.12, T10.13, T10.14 |
| **Blocks** | — |
| **Labels** | web, a11y |

## Implementation steps
1. Run axe + Lighthouse accessibility on `/plan`, `/explore`, `/r/:id`, `/login` (production build).
2. Fix quick wins (labels, contrast, focus order); defer anything structural.
3. Write `docs/a11y/verification.md`: scores, issues found/fixed/deferred, date, method.
4. Amend PRODUCT.md's WCAG claim to cite the evidence; record the known gap — map waypoint
   placement is pointer-only — as a documented limitation (keyboard placement is out of scope).

## Acceptance criteria
- [x] Evidence file exists with per-route results and dates.
- [x] No new axe critical/serious violations on the four routes after quick wins.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `docs/a11y/verification.md` (new) · `PRODUCT.md` · touched components as needed

## Suggested commit(s)
- `docs(a11y): WCAG verification evidence; fix quick-win violations`
