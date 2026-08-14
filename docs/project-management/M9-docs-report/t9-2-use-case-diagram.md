# T9.2 — Use-case diagram

> Produce the use-case diagram (User + Viewer actors and their interactions) for Requirement Gathering.

| Field | Value |
|---|---|
| **Task ID** | T9.2 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | T9.8 |
| **Labels** | docs, diagram |

## Context & rationale
The report's Requirement Gathering section needs a use-case diagram; PRD §6 user stories map directly
to it (PRD §16, PROJECT-SPEC.md §13). Two actors only: User and Viewer.

## Spec references
- PRD §5 (actors), §6 (stories), §16
- PROJECT-SPEC.md §13

## Implementation steps
1. Draw actors (User, anonymous Viewer) and use cases: register/login, plot, analyze, save, share, list mine, explore, view shared, export.
2. Show which use cases need auth vs. are anonymous.
3. Export to `docs/diagrams/use-case.*` (draw.io source + PNG/SVG).
4. Also add a simple plot→analyze→save→share **flow** diagram for Project Description.

## Acceptance criteria
- [ ] Use-case diagram covers all PRD §6 stories with correct actor associations.
- [ ] Auth vs. anonymous distinction visible.
- [ ] Exported (source + image) under `docs/diagrams/`.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/diagrams/use-case.drawio`, `docs/diagrams/use-case.png`, `docs/diagrams/flow.*`

## WOOLF report mapping
- *Requirement Gathering* · *Project Description*.

## Suggested commit(s)
- `docs(diagrams): use-case + high-level flow`
