# M4 — Persistence

> Persist routes (GeoJSON + embedded profile), set up the geo index, and ship create/getById/listMine with real authz.

## Why this milestone

This milestone makes analyses durable and shareable, and lays the document-schema and indexing
groundwork the report is graded on (PRD §11, PROJECT-SPEC.md §6). The embed-vs-reference choices, the
GeoJSON-in-Json workaround, and the externally-created `2dsphere` index are all explicit design
talking points; ownership enforcement is the security story.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T4.1](./t4-1-route-model-geojson-in-json-embedded-profile-db-push.md) | Route model (GeoJSON in Json, embedded profile) + db push | P0 | 0.5d | T0.4 |
| [T4.2](./t4-2-2dsphere-index-setup-script.md) | 2dsphere index setup script | P0 | 0.5d | T4.1 |
| [T4.3](./t4-3-routes-repository-data-layer.md) | Routes repository (data layer) | P0 | 1d | T4.1 |
| [T4.4](./t4-4-routescreate-auth.md) | routes.create (auth) | P0 | 0.5d | T4.3, T3.3 |
| [T4.5](./t4-5-routesgetbyid-public-if-ispublic.md) | routes.getById (public if isPublic) | P0 | 0.5d | T4.3 |
| [T4.6](./t4-6-routeslistmine-auth-paginated.md) | routes.listMine (auth, paginated) | P0 | 0.5d | T4.3 |
| [T4.7](./t4-7-authz-ownership-enforcement.md) | AuthZ + ownership enforcement | P0 | 0.5d | T4.4–T4.6 |
| [T4.8](./t4-8-persistence-authz-tests.md) | Persistence + authz tests | P0 | 1d | T4.4–T4.7 |

## Entry criteria (what must be true before starting)

- M3 done: `routes.analyze` + analyzeRoute service available to populate saved fields.
- Auth (M0) and Prisma client + replica set available.

## Exit criteria (milestone is done when…)

- A user can save, list, and fetch routes; public routes are anonymously viewable, private ones are not.
- `2dsphere` index on `routes.path` created via the setup script (ready for M6).
- Ownership enforced on writes/owned reads; persistence + authz tests green.

## WOOLF report artifacts produced here

- *Database Schema Design* — routes schema, embed/reference rationale, indexes (incl. 2dsphere).
- *Requirement Gathering* (FR-5/6) · *Conclusion* — security model.
