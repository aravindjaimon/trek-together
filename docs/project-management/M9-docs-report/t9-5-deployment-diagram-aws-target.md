# T9.5 — Deployment diagram (AWS target)

> Document the target AWS deployment (EC2/Beanstalk + MongoDB Atlas/DocumentDB, VPC, optional ElastiCache).

| Field | Value |
|---|---|
| **Task ID** | T9.5 |
| **Milestone** | M9 — Docs & report |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | T9.8 |
| **Labels** | docs, diagram |

## Context & rationale
The report's Deployment Flow section is required even if the app is deployed minimally (PRD §16,
PROJECT-SPEC.md §13). Show a realistic target topology.

## Spec references
- PROJECT-SPEC.md §13 (deployment target), PRD §16

## Implementation steps
1. Draw: client/PWA → CDN/static host for `apps/web`; Node/Express (`apps/server`) on EC2 or Elastic Beanstalk; VPC + security groups; MongoDB Atlas or Amazon DocumentDB; optional ElastiCache (Redis) if caching is upgraded.
2. Show env/secrets handling and the external elevation APIs as outbound dependencies.
3. Note what was actually deployed (if anything) vs. the target.
4. Export to `docs/diagrams/deployment.*`.

## Acceptance criteria
- [ ] Deployment diagram shows server, DB, networking, and external deps.
- [ ] Target vs. actual clearly distinguished.
- [ ] Exported (source + image) under `docs/diagrams/`.

## Definition of Done
- [ ] Artifact saved under `docs/` (not reconstructed later).
- [ ] `README.md` / `PROJECT-SPEC.md` updated if structure or commands changed.
- [ ] Committed with a `docs:` Conventional Commit.

## Files & paths
- `docs/diagrams/deployment.drawio`, `docs/diagrams/deployment.png`

## WOOLF report mapping
- *Deployment Flow*.

## Suggested commit(s)
- `docs(diagrams): AWS deployment topology`
