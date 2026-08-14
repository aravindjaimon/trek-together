# T0.1 — Generate the Better-T-Stack scaffold

> Generate the Turborepo monorepo from the exact Better-T-Stack command so the agreed stack is the source of truth.

| Field | Value |
|---|---|
| **Task ID** | T0.1 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | T0.2, T0.3, T0.6, T0.7, and effectively all later work |
| **Labels** | infra, scaffold |

## Context & rationale
The repo is currently greenfield — only `PRD.md`, `PROJECT-SPEC.md`, and the WOOLF report template exist.
Everything downstream depends on a correct scaffold. PROJECT-SPEC.md §2 fixes the **exact** command, and it
is the authoritative description of the stack (MongoDB · Prisma · oRPC · Better-Auth · Express ·
React/TanStack Router · Turborepo). Running anything other than this command risks drifting the stack.

⚠️ The scaffolder wants to create a *new* `trek-together/` directory, but ours already contains files
we must keep. Generate into a temp location and merge, so `PRD.md`, `PROJECT-SPEC.md`, and the `.docx`
template are preserved.

## Spec references
- PROJECT-SPEC.md §2 (scaffold command — source of truth), §4 (target structure)
- PRD §14 M0

## Implementation steps
1. From the repo parent dir, run the **exact** command (do not change flags):
   ```bash
   pnpm create better-t-stack@latest trek-together \
     --frontend tanstack-router --backend express --runtime node \
     --api orpc --auth better-auth --payments none \
     --database mongodb --orm prisma --db-setup docker \
     --package-manager pnpm --git --web-deploy none --server-deploy none \
     --no-install --addons husky mcp pwa skills turborepo --examples none
   ```
2. If the scaffolder refuses to target a non-empty dir, generate into `../trek-together-scaffold/`
   then `rsync`/move the generated tree in, **without** overwriting `PRD.md`, `PROJECT-SPEC.md`, or the
   report `.docx`.
3. Inspect the generated tree: confirm `apps/web`, `apps/server`, `turbo.json`,
   `pnpm-workspace.yaml`, `bts.jsonc`, root `package.json` (with `packageManager: pnpm@…`), `.husky/`.
4. Confirm `--no-install` left dependencies uninstalled (no top-level `node_modules`) — install is T0.2.
5. Note the real port numbers the scaffold assigned (server/web) for §10/§8 reconciliation in T0.8.

## Acceptance criteria
- [ ] `apps/web` and `apps/server` exist with the expected sub-structure (PROJECT-SPEC.md §4).
- [ ] `bts.jsonc` records exactly the chosen options (mongodb, prisma, orpc, better-auth, express, tanstack-router, turborepo, addons husky/mcp/pwa/skills).
- [ ] Pre-existing `PRD.md`, `PROJECT-SPEC.md`, and the report `.docx` are untouched.
- [ ] An initial scaffold commit exists (from `--git`).

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Generated tree spot-checked against PROJECT-SPEC.md §4; deltas noted for T0.8.

## Files & paths
- `apps/`, `turbo.json`, `pnpm-workspace.yaml`, `bts.jsonc`, root `package.json`, `.husky/`

## WOOLF report mapping
- *Technologies Used* — the scaffold fixes the concrete stack to describe.

## References
- Better-T-Stack — https://better-t-stack.dev/
- Turborepo — https://turborepo.com/docs

## Suggested commit(s)
- `chore: scaffold Trek Together monorepo via Better-T-Stack`
