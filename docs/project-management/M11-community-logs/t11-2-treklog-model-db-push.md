# T11.2 — TrekLog Prisma model + db push

| Field | Value |
|---|---|
| **Task ID** | T11.2 |
| **Milestone** | M11 — Community Trek Logs |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.25d |
| **Depends on** | T11.1 |
| **Blocks** | T11.3 |
| **Labels** | db |

## Implementation steps
1. New `packages/db/prisma/schema/trek-log.prisma` — the `TrekLog` model per
   [`decisions/trek-logs.md`](../../decisions/trek-logs.md): `userId`, denormalized `userName`,
   `routeId`, `completedOn`, `actualDurationS`, `rating`, `notes?`, `createdAt`;
   `@@index([routeId, createdAt(sort: Desc)])`, `@@index([userId])`, `@@map("trekLogs")`.
2. `pnpm db:push` (never raw `prisma db push` — it drops the geo/TTL indexes on the other models).

## Acceptance criteria
- [x] `pnpm db:push` syncs the model; `trekLogs` collection + both indexes exist.
- [x] No `setup-indexes.ts` change needed (indexes are plain Prisma, not geo/TTL).

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` green; client regenerated.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `packages/db/prisma/schema/trek-log.prisma` (new)

## Suggested commit(s)
- `feat(db): trekLogs model + indexes`
