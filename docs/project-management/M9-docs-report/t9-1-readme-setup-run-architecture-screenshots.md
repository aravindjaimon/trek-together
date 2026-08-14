# T9.1 — README (setup, run, architecture, screenshots)

> Write the repo README a reviewer needs: what it is, setup, run, architecture, and screenshots.

| Field | Value |
|---|---|
| **Task ID** | T9.1 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | M3–M6 |
| **Blocks** | T9.8 |
| **Labels** | docs |

## Context & rationale
The public repo + a thorough README are explicit deliverables (PROJECT-SPEC.md §1/§14). Reviewers judge a lot
from the README; it also feeds the report's Technologies/Description sections.

## Spec references
- PROJECT-SPEC.md §1 (deliverables), §14 (thorough README)
- PRD §16

## Implementation steps
1. Overview (what Trek Together is + the plot→analyze→save→share loop) with a hero screenshot.
2. Stack summary + architecture diagram (layering §3) and the monorepo layout.
3. Setup: prerequisites (Node 24.17.0, pnpm 11.8.0, Docker), `pnpm install`, `pnpm db:start`, `pnpm db:push`, `pnpm db:indexes`, `.env` from `.env.example`.
4. Run: `pnpm dev`; how to seed/benchmark; how to run tests.
5. Feature screenshots (planner, profile, difficulty, explore) + a link to `docs/`.
6. Acknowledge AI-tool assistance per the report's declaration (PROJECT-SPEC.md §14).

## Acceptance criteria
- [ ] A new reader can set up and run the app from the README alone.
- [ ] Architecture + monorepo layout documented; commands match reality (§8).
- [ ] Screenshots included; `docs/` linked.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `README.md`, `docs/diagrams/architecture.*`

## WOOLF report mapping
- *Project Description* · *Technologies Used*.

## Suggested commit(s)
- `docs: comprehensive README (setup, run, architecture, screenshots)`
