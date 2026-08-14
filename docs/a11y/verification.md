# Accessibility verification — WCAG 2.2 AA

**Date:** 2026-07-11 · **Task:** T10.15 · **Method:** axe-core 4.12.1 run in-browser
(Playwright-driven Chromium) against the running dev app, rule tags
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.

This is the evidence backing [`PRODUCT.md`](../../PRODUCT.md)'s WCAG 2.2 AA commitment. Re-run by
serving `axe.min.js` from `apps/web/public/`, injecting it on each route, and calling `axe.run()`
with the tag set above.

## Results — 0 violations after fixes

| Route | Light | Dark | Notes |
|---|:--:|:--:|---|
| `/plan` | ✅ 0 | — | Map planner + analysis panel |
| `/explore` | ✅ 0 | ✅ 0 | Result list + difficulty badges |
| `/r/:id` | ✅ 0 | ✅ 0 | Route view, export + delete actions, grade-4 route |
| `/login` | ✅ 0 | — | Auth form, password show/hide toggle |

## Issues found & fixed

- **`color-contrast` (serious) — grade-4 difficulty badge.** On `/explore`, the "Strenuous"
  badge text (`--grade-4` = `#c23f00`) over its 12%-tint background (`#f8e8e0`) measured **4.39:1**,
  just under the 4.5:1 threshold for small text. Fixed by darkening the light-mode token
  `--grade-4` from `oklch(0.55 0.18 42)` → `oklch(0.52 0.18 42)`
  (`packages/ui/src/styles/globals.css`). Re-verified: 0 violations. The other four grades and all
  dark-mode grades already passed.

## Known limitations (documented, not blocking)

- **Map waypoint placement is pointer-only** (`apps/web/src/components/leaflet-map.tsx` — vertices
  are added on Leaflet's `click`). There is no keyboard equivalent for dropping a point on the map.
  The surrounding controls (Undo / Clear / Use-my-location, the Analyze button, the save form) are
  all real, keyboard-reachable `<button>`/form controls with `aria-label`s, and Explore offers a
  fully keyboard-navigable result **list** as an alternative to the map markers. Keyboard waypoint
  placement is tracked as future work, out of scope for T10.15.
- **Base UI dev warning** — buttons rendered as links (`<Button render={<Link/>}>`) emit a
  console warning about `nativeButton` semantics in dev. axe reports no violation (the rendered
  `<a href>` is a valid link); this is a development-mode DX warning only.

## Scope note

axe-core automates ~30–50% of WCAG success criteria (contrast, names/roles/values, landmark
structure, ARIA validity, etc.). It does not replace full manual audit of criteria like focus
order, meaningful sequence, or cognitive load — but it is the reproducible, regression-catchable
baseline this project commits to.
