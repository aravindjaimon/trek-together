# T9.7 — Consolidate benchmark artifacts

> Pull the cache and index benchmarks into a single results write-up with method, numbers, and plots.

| Field | Value |
|---|---|
| **Task ID** | T9.7 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T3.5, T6.3 |
| **Blocks** | T9.8 |
| **Labels** | docs, performance, report |

## Context & rationale
The report's primary + secondary optimisations (NFR-P3/P4) need a clean, consolidated results section.
The raw numbers already exist from T3.5 and T6.3 — this assembles them with method and charts so they
aren't reconstructed at the end (PROJECT-SPEC.md §9/§13, PRD §13).

## Spec references
- PROJECT-SPEC.md §9 (keep numbers as you go), §13
- PRD §13, NFR-P3/P4

## Implementation steps
1. Combine `docs/benchmarks/cache.md` (cold-vs-warm + hit ratio) and `docs/benchmarks/index.md` (on/off + explain) into `docs/benchmarks/README.md`.
2. Add charts (latency bars; before/after `totalDocsExamined`) and state the test environment + method.
3. Write the 'so what' — quantify the speed-up and tie it to the design.
4. Sanity-check the numbers are reproducible from the harnesses.

## Acceptance criteria
- [ ] One results doc presents both benchmarks with method, numbers, and charts.
- [ ] Speed-ups quantified and explained.
- [ ] Reproducible from the committed harnesses.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/benchmarks/README.md` (+ charts)

## WOOLF report mapping
- *Feature Development Process* (headline) · *Database Schema Design* (index) · *Conclusion*.

## Suggested commit(s)
- `docs(benchmarks): consolidated cache + index results`
