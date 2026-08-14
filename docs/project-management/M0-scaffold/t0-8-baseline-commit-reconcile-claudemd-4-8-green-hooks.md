# T0.8 — Baseline commit, reconcile PROJECT-SPEC.md §4/§8, green hooks

> Make PROJECT-SPEC.md §4 (structure) and §8 (commands) match the generated reality, and confirm Husky hooks pass.

| Field | Value |
|---|---|
| **Task ID** | T0.8 |
| **Milestone** | M0 — Scaffold |
| **Status** | ◐ In progress |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T0.1–T0.7 |
| **Blocks** | — |
| **Labels** | docs, infra |

## Context & rationale
PROJECT-SPEC.md §4/§8 are written against the *target* scaffold and explicitly ask to be reconciled with the
real tree once generated (PROJECT-SPEC.md §15). Doing this now keeps the guide trustworthy for every later
session and confirms the commit gate is green.

## Spec references
- PROJECT-SPEC.md §4, §8, §12 (commits), §15 (keep these accurate)

## Implementation steps
1. Diff the generated tree vs. PROJECT-SPEC.md §4; update §4 to the real paths.
2. Replace §8 placeholder script names with the real ones from root `package.json` (`db:*`, `dev*`, `check-types`, `lint`, `build`, `test`).
3. Confirm Husky pre-commit runs lint/format/type-check and passes on the scaffold.
4. Ensure the GitHub repo is created and **public** (PRD/PROJECT-SPEC.md §12); push the baseline.
5. Tag or note this as the "M0 complete" point in history.

## Acceptance criteria
- [x] PROJECT-SPEC.md §4 and §8 match the generated repo. _(§4 rewritten to the package-based tree; §8 to the real scripts incl. `lint`/`format`/`test`/`db:ping`; §6 schema path fixed. pnpm 11.9.0 vs 11.8.0 delta documented.)_
- [x] `git commit` triggers Husky and passes. _(All M0 commits ran `lint-staged → biome check --write` green; previously the lint-staged command was empty — now does real work.)_
- [ ] Public GitHub repo exists with the scaffold + M0 commits pushed. _**(User-owned, per agreed split: I commit locally; the user creates the public repo + pushes.** No remote configured; history is push-ready — see notes.)_

## Definition of Done
- [x] PROJECT-SPEC.md updated and committed (`docs:`).
- [ ] Hooks green; baseline pushed to public remote. _(Hooks green ✓; **push is the user's step.**)_

## Completion notes (2026-06-30)
- §4 now documents the **package-based** reality (`packages/api|auth|db|env|ui|config`, thin `apps/server`),
  plus M0 additions (`biome.json`, `vitest.config.ts`, `.nvmrc`, `engines`). §8 lists the real commands and
  documents that the pre-commit runs Biome via lint-staged (type-check is a separate gate) and that
  `db:migrate` must never run on Mongo. CLAUDE.md remains the operational source of truth.
- **Remaining (user):** create a **public** GitHub repo and push. History is clean/dated/conventional:
  `git remote add origin <url> && git push -u origin development` (then open/merge to `main` as desired).

## Post-completion audit (2026-06-30)
An independent multi-agent audit (gate-runner + one auditor per task + adversarial critic) re-verified M0
against the live repo. It surfaced one real regression and two verification gaps, all now addressed:
- **Lint gate had gone RED** (`pnpm lint` exit 1): the harness had created `.claude/settings.local.json`
  (machine-local Claude settings), which is ignored by the *global* gitignore but not the repo's — so Biome
  (`useIgnoreFile` reads only the repo `.gitignore`) linted it and flagged a format diff. Fixed by ignoring
  `.claude/settings.local.json` in the repo `.gitignore` and excluding `.claude` in `biome.json`. `pnpm lint`
  is green again (one pre-existing scaffold **warning**, `orpcUtils` in `__root.tsx`, remains — M7 cleanup).
- **Web boot verified** (the prior session only booted the server): `pnpm dev:web` → Vite ready, `GET /` → 200
  serving `<title>trek-together</title>`. So the exit criterion "`pnpm dev` boots web + server" holds for both apps.
- **CLAUDE.md refreshed**: removed stale "no lint/test/Vitest", "replica set not configured", "port hard-coded",
  "no `.env.example`" claims now that M0 is done.
- Confirmed green: `lint` / `check-types` / `test` / `build` all exit 0; `db:ping` `{ok:1}`; `rs.status().ok=1`.

## Files & paths
- `PROJECT-SPEC.md`, `.husky/`, root `package.json`

## WOOLF report mapping
- *Project Description* / *Technologies Used* — accurate structure & commands.

## Suggested commit(s)
- `docs: reconcile PROJECT-SPEC.md structure/commands with generated scaffold`
