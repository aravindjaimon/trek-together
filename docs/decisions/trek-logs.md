# Community Trek Logs — data model & aggregation

**Decision date:** 2026-07-11
**Status:** Accepted (M11)

## Context

`PROJECT-SPEC.md §5.6/§6/§7` always specified a community layer: authenticated users log completed
treks (date, actual duration, rating, notes) per route, aggregated into per-route stats. The PRD had
descoped it as a v1 non-goal; the Trail-Ready v1.0 goal brings it into scope (PRD §4 scope-change
note, FR-10). This records how it's built.

## Schema (`packages/db/prisma/schema/trek-log.prisma`)

```
TrekLog {
  id              ObjectId @map("_id")
  userId          String              // Better-Auth user id — referenced, not a Prisma relation
  userName        String              // denormalized at create for display (avoids a $lookup per list)
  routeId         ObjectId            // references Route — referenced, not a relation
  completedOn     DateTime            // date semantics; stored UTC
  actualDurationS Float               // SI seconds, like the rest of the domain
  rating          Int                 // 1–5, enforced by Zod not the DB
  notes           String?
  createdAt       DateTime @default(now())
  @@index([routeId, createdAt(sort: Desc)])   // list newest-first for a route
  @@index([userId])
  @@map("trekLogs")
}
```

### Decisions

- **Referenced, not related.** MongoDB has no FKs; ownership/existence are app-layer invariants
  already (see [`data-model.md`](./data-model.md)). `userId`/`routeId` are plain string/ObjectId
  references, consistent with how `Route.ownerId` works.
- **`userName` denormalized.** Logs render a display name; denormalizing at create time avoids a
  per-list `$lookup` against the auth `user` collection. The tradeoff (a renamed user's old logs keep
  the old name) is acceptable for a capstone community feed.
- **Indexes are plain Prisma `@@index`.** Nothing here is geo or TTL, so — unlike `Route.path`'s
  2dsphere and `ElevationCache`'s TTL — these need **no** `setup-indexes.ts` entry; `prisma db push`
  manages them.
- **No `unique(userId, routeId, completedOn)`.** It would only weakly deter duplicate logs while
  adding real error-mapping cost (a duplicate would need its own typed error). Skipped; a user may
  legitimately log the same route on the same day twice.

## Aggregation

Stats are computed in the data layer via `aggregateRaw`: `$match { routeId }` → `$group` with
`{ count: $sum 1, avgRating: $avg $rating, avgActualDurationS: $avg $actualDurationS }`. Extended-JSON
values are decoded with the same `num()` helper the routes repo uses (`routes.repo.ts`). Stats are
returned **inside** `logs.listForRoute` (`{ items, total, stats }`) rather than as a separate
`logs.statsForRoute` procedure — the spec treats "logs + aggregate stats" as one read, and the UI
always shows them together (YAGNI on a second procedure).

## Authorization

Both procedures gate on route **visibility**, reusing `findVisibleRoute` from
`routers/routes/authz.ts` (a route is visible if public or owned by the caller), which surfaces a
uniform `NOT_FOUND` for missing-or-forbidden — no existence leak:

- `logs.create` — `protectedProcedure`; the route must be visible to the caller. Author identity
  (`userId`, `userName`) comes from `context.session`, never the client.
- `logs.listForRoute` — `publicProcedure`; readable anonymously **iff** the route is visible
  (i.e. public). Private-route logs are visible only to the owner.

## Validation (Zod, at the boundary)

`rating` integer 1–5 · `completedOn` not in the future · `0 < actualDurationS ≤ 7 days` ·
`notes` ≤ 2000 chars · `routeId` a valid ObjectId · list `limit` capped at 50.
