# T9.4 — ER / collection schema diagram

> Produce the collection/ER diagram showing user, routes (with embedded profile), elevationCache, and indexes.

| Field | Value |
|---|---|
| **Task ID** | T9.4 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | M4 |
| **Blocks** | T9.8 |
| **Labels** | docs, diagram |

## Context & rationale
The Database Schema Design section needs a collection diagram plus the embedding-vs-referencing and
index rationale (PRD §11, PROJECT-SPEC.md §6/§13). Pull from the decisions docs written in M1/M4.

## Spec references
- PRD §11, §16
- PROJECT-SPEC.md §6, §13

## Implementation steps
1. Draw collections: `user` (+ Better-Auth `session`/`account`/`verification`), `routes` (embedded `elevationProfile`, GeoJSON `path`), `elevationCache`, `trekLogs` (note: community is a non-goal v1 — mark as future).
2. Show references (routes.ownerId → user) vs. embedding (profile in route); annotate indexes (`2dsphere` on path; unique+TTL on cache; standard on ownerId/isPublic/difficultyScore).
3. Fold in the `docs/decisions/data-model.md` rationale.
4. Export to `docs/diagrams/er-schema.*`.

## Acceptance criteria
- [ ] Diagram shows all v1 collections, fields, references vs. embeds, and indexes.
- [ ] Embedding/referencing rationale captured.
- [ ] Exported (source + image) under `docs/diagrams/`.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/diagrams/er-schema.drawio`, `docs/diagrams/er-schema.png`

## WOOLF report mapping
- *Database Schema Design*.

## Suggested commit(s)
- `docs(diagrams): ER / collection schema`
