# Route Data Model — Embed vs Reference

**Decision date:** 2026-07-10  
**Status:** Accepted

## Context

A saved `Route` (the `routes` collection) persists the full `routes.analyze` result so
route views and exports never recompute (PRD §11, PROJECT-SPEC.md §6). MongoDB gives a
per-field choice — **embed** the data in the document, or **reference** it by id — and each
Route field falls to a different answer. Getting this right is a graded schema-design
decision.

## Decisions

| Field | Choice | Why |
|---|---|---|
| `path` (geometry) | **GeoJSON in a `Json` field** | Prisma has no geometry type, so the LineString is stored as GeoJSON in a `Json` column. Coordinates are `[lng, lat]` (GeoJSON / `2dsphere` order), validated in app code (Zod + the `geojson` service), not by Prisma. |
| `elevationProfile` | **Embedded** (composite `type ProfilePoint`) | Read together with the route, bounded in size (capped sample count), and never queried on its own. Embedding means one document read serves the whole view — no join, no second round-trip. |
| `owner` | **Referenced** (`ownerId: String`, no Prisma relation) | The user has an independent lifecycle from their routes, and Mongo enforces no foreign key regardless. Storing the better-auth user id (a `String`) as a plain indexed field keeps the reference explicit without coupling the two schemas. |

## Indexes

- Standard B-tree indexes on `ownerId` (owner-scoped `listMine`), `isPublic` (public
  browsing/explore filters), and `difficultyScore` (future difficulty filters) — all
  declared in `route.prisma`.
- **`2dsphere` on `path`** for the M6 `$geoNear` explore query. Prisma cannot declare a geo
  index on a `Json` field, so it is created out-of-band by
  `packages/db/src/setup-indexes.ts`, which must run **after every `prisma db push`** (push
  reconciles indexes to the schema and drops ones it doesn't manage). `db:push` runs it
  automatically; `db:setup-indexes` runs it standalone. Every `createIndex` is idempotent.

## Consequences

- A route view or export is a single document fetch — no assembly across collections.
- The `2dsphere` index lives outside the Prisma schema, so schema changes must be paired
  with a `setup-indexes` run (documented, and wired into `db:push`).
- Ownership is not FK-enforced; the app layer owns that invariant (see `route-access`
  service and the ownership tests).

## References

- PROJECT-SPEC.md §6 (routes collection, embed vs reference, `2dsphere` outside Prisma)
- PRD §11 (persisted analysis), FR-6 / A3 (public share-by-link)
- Prisma MongoDB — https://www.prisma.io/docs/orm/overview/databases/mongodb
