# M7 — Frontend

> Build the React/TanStack-Router UI: auth, the map planner, analysis visualisation, save/list, public view, and explore.

## Why this milestone

The frontend makes the backend demonstrable end-to-end (plot → analyze → save → share → discover) and
provides the screenshots the README and report need (PRD §6/§13). It is intentionally thin over the
typed oRPC API — the backend remains the star — but it must exercise every feature so the capstone
demo is complete.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T7.1](./t7-1-orpc-client-auth-client-wiring.md) | oRPC client + auth-client wiring | P0 | 0.5d | T0.5, T0.6 |
| [T7.2](./t7-2-auth-ui-register-login-logout-persistence.md) | Auth UI (register/login/logout, persistence) | P0 | 1d | T7.1 |
| [T7.3](./t7-3-leaflet-map-route-planner.md) | Leaflet map + route planner | P0 | 1.5d | T7.1 |
| [T7.4](./t7-4-analyze-action-elevation-profile-chart.md) | Analyze action + elevation profile chart | P0 | 1d | T7.3, T3.3 |
| [T7.5](./t7-5-difficulty-badge-time-ascent-summary.md) | Difficulty badge + time/ascent summary | P1 | 0.5d | T7.4 |
| [T7.6](./t7-6-save-form-listmine-view.md) | Save form + listMine view | P1 | 1d | T7.3, T4.4, T4.6 |
| [T7.7](./t7-7-public-route-view-export-buttons.md) | Public route view + export buttons | P1 | 1d | T4.5, T5.4 |
| [T7.8](./t7-8-explore-map-routes-near-me.md) | Explore map (routes near me) | P1 | 1d | T6.2 |

## Entry criteria (what must be true before starting)

- Backend procedures available: analyze (M3), create/getById/listMine (M4), export (M5), explore (M6).
- Auth wired server-side (M0).

## Exit criteria (milestone is done when…)

- A user can register/login, plot a route, analyze it, save it, and view their routes.
- A viewer can open a public link and export GPX/JSON with no account.
- Explore shows nearby public routes. Screenshots captured for README/report.

## WOOLF report artifacts produced here

- *Requirement Gathering* — every user/viewer story exercised.
- *Technologies Used* — React, TanStack Router, Leaflet.
- Screenshots for *Project Description* / results.
