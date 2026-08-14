# T4.8 — Persistence + authz tests

> Test create/getById/listMine and ownership rules against a real (test) Mongo replica set.

| Field | Value |
|---|---|
| **Task ID** | T4.8 |
| **Milestone** | M4 — Persistence |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T4.4–T4.7 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
Persistence + authz are correctness-critical and security-relevant (PRD §13, NFR-S2). Test against a
real replica set (Prisma needs one) — a throwaway Docker instance or a dedicated test DB.

## Spec references
- PROJECT-SPEC.md §2 (testing), §6 (replica set)
- PRD §13, NFR-S2

## Implementation steps
1. Set up a test DB (test container or separate DB name) and reset between tests.
2. Test create→getById round-trip (owner + anonymous-public + private-hidden).
3. Test `listMine` pagination + owner scoping.
4. Test authz: non-owner edit/delete denied; unauthenticated writes denied.
5. Wire into `pnpm test` (tag DB-dependent tests so they can be skipped without Docker).

## Acceptance criteria
- [ ] Round-trip + visibility cases pass against a real replica set.
- [ ] Ownership/authz violations are rejected with the right typed errors.
- [ ] Pagination/owner-scoping verified.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/*.test.ts`, test DB helper

## WOOLF report mapping
- *Conclusion* — verified persistence + security.

## Suggested commit(s)
- `test(routes): persistence + authorization tests`
