# T10.5 — CI workflow (lint/check-types/test/build)

> Gates are local-only (Husky); nothing enforces green on push. Add GitHub Actions so the T0.8 repo
> push lights up CI immediately.

| Field | Value |
|---|---|
| **Task ID** | T10.5 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.25d |
| **Depends on** | — |
| **Blocks** | T12.1 |
| **Labels** | ci, infra |

## Implementation steps
1. `.github/workflows/ci.yml`: on push/PR → pnpm/action-setup → setup-node 24 (pnpm cache) →
   `pnpm install --frozen-lockfile` (postinstall runs `prisma generate`, no DB) → `pnpm lint` →
   `pnpm check-types` → `pnpm test` → `pnpm build`.
2. `VITE_SERVER_URL` env for the web build (validated at build time).
3. Comment: no Mongo service — all test suites are DB-free; benchmark scripts are excluded from
   `pnpm test` (need live Mongo).

## Acceptance criteria
- [x] Workflow runs all four gates; would fail on any non-zero exit.
- [x] No secrets required; runs on a fork/fresh clone.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green locally.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `.github/workflows/ci.yml` (new)

## Suggested commit(s)
- `ci: lint/check-types/test/build on push`
