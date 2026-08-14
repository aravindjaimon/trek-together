# T10.11 — Chores: pin mongo:8.0, reuse prisma singleton in auth

| Field | Value |
|---|---|
| **Task ID** | T10.11 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P2 |
| **Estimate** | 0.1d |
| **Depends on** | — |
| **Blocks** | — |
| **Labels** | db, chore |

## Implementation steps
1. `packages/db/docker-compose.yml`: `image: mongo` → `image: mongo:8.2` (matches the existing
   volume's data files; an unpinned major can break a fresh pull).
2. `packages/auth/src/index.ts`: import the `prisma` singleton from `@trek-together/db` instead of
   `createPrismaClient()` — one connection pool per process, not two.

## Acceptance criteria
- [x] `pnpm db:start` + `pnpm db:ping` green on the pinned image.
- [x] Auth flow works against the shared client (register/login round-trip).

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed as one Conventional-Commit unit.

## Files & paths
- `packages/db/docker-compose.yml` · `packages/auth/src/index.ts`

## Suggested commit(s)
- `chore(db,auth): pin mongo:8.0; share the prisma singleton`
