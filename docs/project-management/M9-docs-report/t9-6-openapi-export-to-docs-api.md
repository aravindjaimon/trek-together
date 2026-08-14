# T9.6 — OpenAPI export to docs/api/

> Export the oRPC OpenAPI spec and a browsable view (Swagger/Postman) into docs/api/.

| Field | Value |
|---|---|
| **Task ID** | T9.6 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | M3–M6 |
| **Blocks** | T9.8 |
| **Labels** | docs, api |

## Context & rationale
oRPC is OpenAPI-compatible; exporting a spec gives the report a concrete API artifact and a
Swagger/Postman view (PRD §12, PROJECT-SPEC.md §7/§13).

## Spec references
- PROJECT-SPEC.md §7 (OpenAPI export), §13
- PRD §12

## Implementation steps
1. Generate the OpenAPI document from the oRPC routers; write to `docs/api/openapi.json`.
2. Add a browsable view (Swagger UI static page or a committed Postman collection).
3. Ensure every procedure (analyze, create, getById, listMine, explore, export, auth) is represented with its schemas + the typed error shape.
4. Note how to regenerate it (script/command) so it stays current.

## Acceptance criteria
- [ ] `docs/api/openapi.json` exported and covers all procedures.
- [ ] A browsable view (Swagger/Postman) is committed.
- [ ] Regeneration step documented.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/api/openapi.json`, `docs/api/` (Swagger/Postman)

## WOOLF report mapping
- *Feature Development Process* · *Technologies Used*.

## References
- oRPC OpenAPI — https://orpc.unnoq.com/

## Suggested commit(s)
- `docs(api): export openapi spec + browsable view`
