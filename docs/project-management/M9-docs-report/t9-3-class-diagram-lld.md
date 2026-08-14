# T9.3 — Class diagram (LLD)

> Produce the low-level design class diagram from the real routers, services, repositories, and models.

| Field | Value |
|---|---|
| **Task ID** | T9.3 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 1d |
| **Depends on** | M3, M4 |
| **Blocks** | T9.8 |
| **Labels** | docs, diagram |

## Context & rationale
The report's Class Diagrams (LLD) section must reflect the actual code: oRPC routers, service classes,
data/repository modules, integrations, and Prisma models (PRD §16, PROJECT-SPEC.md §13).

## Spec references
- PROJECT-SPEC.md §3 (layers), §13
- PRD §12, §16

## Implementation steps
1. Inventory modules per layer (routers/services/data/integrations/lib) and their key functions/types.
2. Draw the relationships (procedure → service → repo → Prisma/raw Mongo; integrations behind the cache).
3. Keep it faithful to the code as built (update if code changed since the PRD).
4. Export to `docs/diagrams/class-lld.*` (source + image).

## Acceptance criteria
- [ ] Diagram matches the real layered modules + their dependencies.
- [ ] Flagship path (analyze) is legible end-to-end.
- [ ] Exported (source + image) under `docs/diagrams/`.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/diagrams/class-lld.drawio`, `docs/diagrams/class-lld.png`

## WOOLF report mapping
- *Class Diagrams (LLD)*.

## Suggested commit(s)
- `docs(diagrams): low-level class diagram`
