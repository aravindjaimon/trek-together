# M10 — Stabilize & Harden

> **Goal:** a trekker can plan, analyze, save, share, and explore treks with no dead ends — every
> external dependency (elevation, routing, Mongo) fails typed and recoverable, the server survives
> restarts/floods/quota exhaustion, and every UI state (loading/error/empty/offline) is designed.

Part of the **Trail-Ready v1.0** goal (M10 stabilize · M11 community logs · M12 deploy-ready), which
moves the app from "capstone complete" (M0–M9) to "real trekkers can rely on it." Scope decisions and
the audit that produced this backlog are recorded in the plan of 2026-07-11; headline risks addressed:

- **C1** — a single null elevation sample (ocean / outside SRTM coverage) 500s the whole analysis.
- **C2** — the 1 req/s elevation limiter is created per-request, so concurrent users blow the shared
  ~1000/day provider quota; no retry/backoff, no daily circuit breaker.
- **C3** — no HTTP rate limiting, no auth brute-force backstop, no security headers, no body cap.
- Ops: no graceful shutdown, `/health` never pings Mongo, no crash handlers, no CI.
- UX: error states rendered as empty states, no delete confirmation, persisted cache survives
  sign-out, guest route drafts lost at login, no offline indicator.

## Tasks (strict order)

| Task | Title | Pri | Est |
|---|---|:--:|:--:|
| T10.1 | Snap procedure tests (snap.test.ts + vertex-cap coverage) | P0 | 0.25d |
| T10.2 | Snap race guard + 25-waypoint client cap | P0 | 0.25d |
| T10.3 | Explore fit-bounds after locate + drop home health toast | P1 | 0.25d |
| T10.4 | Preserve plan draft across login (sessionStorage) | P1 | 0.25d |
| T10.5 | CI workflow (lint/check-types/test/build) | P0 | 0.25d |
| T10.6 | Elevation quota hardening: global limiter, breaker, retry | P0 | 1d |
| T10.7 | Tolerate null-elevation gaps with coverage threshold | P0 | 0.5d |
| T10.8 | HTTP hardening: helmet, rate limits, body caps | P0 | 0.5d |
| T10.9 | Server lifecycle: graceful shutdown, real /health, index verify | P1 | 0.5d |
| T10.10 | Request logging + quiet expected errors | P1 | 0.5d |
| T10.11 | Chores: pin mongo:8.0, reuse prisma singleton in auth | P2 | 0.1d |
| T10.12 | Error cards on Explore/My Routes + 60s client timeout | P1 | 0.5d |
| T10.13 | Delete confirmation + clear persisted cache on sign-out | P1 | 0.5d |
| T10.14 | Offline banner + offline-aware empty states | P1 | 0.5d |
| T10.15 | A11y verification pass (axe/Lighthouse + evidence) | P1 | 0.5d |

Statuses live in each task file and [`../TRACKER.md`](../TRACKER.md).
