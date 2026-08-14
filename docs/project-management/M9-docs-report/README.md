# M9 — Docs & report

> Turn the build artifacts into the graded deliverables: README, diagrams, OpenAPI, consolidated benchmarks, and the WOOLF PDF.

## Why this milestone

The capstone is graded on three deliverables — public repo, ZIP, and a ≥40-page PDF report (PROJECT-SPEC.md
§1) — and the report is mapped section-by-section to build artifacts (PRD §16, PROJECT-SPEC.md §13). This
milestone assembles work that should already exist (diagrams drawn alongside code, benchmarks captured
when run) rather than manufacturing it at the end.

## Tasks

| Task | Title | Pri | Est | Depends on |
|---|---|---|---|---|
| [T9.1](./t9-1-readme-setup-run-architecture-screenshots.md) | README (setup, run, architecture, screenshots) | P0 | 1d | M3–M6 |
| [T9.2](./t9-2-use-case-diagram.md) | Use-case diagram | P1 | 0.5d | — |
| [T9.3](./t9-3-class-diagram-lld.md) | Class diagram (LLD) | P1 | 1d | M3, M4 |
| [T9.4](./t9-4-er-collection-schema-diagram.md) | ER / collection schema diagram | P1 | 0.5d | M4 |
| [T9.5](./t9-5-deployment-diagram-aws-target.md) | Deployment diagram (AWS target) | P1 | 0.5d | — |
| [T9.6](./t9-6-openapi-export-to-docs-api.md) | OpenAPI export to docs/api/ | P1 | 0.5d | M3–M6 |
| [T9.7](./t9-7-consolidate-benchmark-artifacts.md) | Consolidate benchmark artifacts | P0 | 0.5d | T3.5, T6.3 |
| [T9.8](./t9-8-woolf-report-assembly-40-pp.md) | WOOLF report assembly (≥40 pp) | P0 | 3d | all |

## Entry criteria (what must be true before starting)

- Core backend (M0–M6) built and benchmarked; frontend (M7) for screenshots; offline evidence (M8).
- Decisions docs (`docs/decisions/*`) and benchmark docs (`docs/benchmarks/*`) already captured.

## Exit criteria (milestone is done when…)

- README lets a reviewer set up, run, and understand the project.
- Use-case, class (LLD), ER/collection, and deployment diagrams exist under `docs/diagrams/`.
- OpenAPI spec exported; benchmarks consolidated.
- ≥40-page WOOLF PDF assembled per the template; public repo + ZIP + PDF ready to submit.

## WOOLF report artifacts produced here

- *All report sections* are produced/finalised here, each backed by earlier-milestone artifacts (PRD §16).

## Notes

This milestone is **ongoing**, not purely terminal: draw each diagram and capture each benchmark when
the relevant milestone lands (PROJECT-SPEC.md §9/§13). Treat T9.8 as assembly + polish, not first drafting.
