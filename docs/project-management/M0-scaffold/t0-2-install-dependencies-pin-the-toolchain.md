# T0.2 — Install dependencies & pin the toolchain

> Install the workspace and pin Node 24.17.0 / pnpm 11.8.0 so every contributor and CI uses the same toolchain.

| Field | Value |
|---|---|
| **Task ID** | T0.2 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.1 |
| **Blocks** | T0.4, T0.6, T2.1, T3.1 |
| **Labels** | infra |

## Context & rationale
`--no-install` means nothing is installed yet (PROJECT-SPEC.md §2). Pinning the runtime avoids
"works-on-my-machine" drift and is a small but real reproducibility story for the report.

## Spec references
- PROJECT-SPEC.md §2 (Node v24.17.0, pnpm v11.8.0), §8 (commands)

## Implementation steps
1. `pnpm install` at the repo root (installs all workspaces).
2. Create `.nvmrc` containing `24.17.0`; add `engines.node` and `engines.pnpm` to root `package.json`.
3. Confirm `packageManager: "pnpm@11.8.0"` is present in root `package.json` (set by scaffold; correct if not).
4. Run the generated scripts once to confirm they exist: `pnpm check-types`, `pnpm lint`, `pnpm build` (build may fail until later tasks — just confirm wiring).
5. Record the actual script names in T0.8 (they may differ from PROJECT-SPEC.md §8 placeholders).

## Acceptance criteria
- [x] `pnpm install` completes cleanly; lockfile committed.
- [x] `.nvmrc` = `24.17.0`; `engines` set; `packageManager` = `pnpm@11.9.0`. _(Scaffold pinned 11.9.0, not the spec's 11.8.0; `engines.pnpm = >=11.9.0`. Delta reconciled in T0.8.)_
- [x] `pnpm check-types` and `pnpm lint` run (pass on the scaffold).

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(No app logic added; tooling only.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(Vitest harness + `cn()` smoke test; 3 tests pass.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Completion notes (2026-06-30)
- Pinned Node via `.nvmrc` (`24.17.0`) + `engines` (`node >=24.17.0`, `pnpm >=11.9.0`).
- Adopted **Biome 2.5.1** as the lint+format gate (`biome.json`): root scripts `lint` (`biome check`),
  `lint:fix`, `format`; `lint-staged` wired to `biome check --write` so the Husky pre-commit does real
  work. Scaffold auto-normalized (import sorting / type imports / formatting); a11y rule
  `noLabelWithoutControl` disabled for `packages/ui` shadcn primitives; `packages/env/src/web.ts`
  `as any` replaced with a typed cast.
- Added **Vitest 4.1.9** (`vitest.config.ts`, `test`/`test:watch` scripts) + a `cn()` smoke test.
- Quality gates wired beyond T0.2 scope are also part of T0.8 (lint-staged, §8 script reconciliation).

## Files & paths
- `pnpm-lock.yaml`, `.nvmrc`, root `package.json`

## References
- pnpm workspaces — https://pnpm.io/workspaces

## Suggested commit(s)
- `chore: install deps and pin node/pnpm toolchain`
