# T3.6 — Integration tests (Supertest)

> End-to-end test routes.analyze over HTTP: valid payload → correct analysis; invalid → typed error.

| Field | Value |
|---|---|
| **Task ID** | T3.6 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T3.3, T3.4 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
Unit tests cover the math (T2.8); this proves the **wire** works: Zod validation, the procedure, the
service, the error shape, all over HTTP (PROJECT-SPEC.md §2 Supertest, PRD §13).

> **Substitution (as-built):** hand-crafting the oRPC RPC wire-envelope for Supertest is impractical, so
> the test drives the endpoint with the generated **oRPC client** (`RPCLink` + `createORPCClient`) over a
> real ephemeral `node:http` server mounting `RPCHandler(appRouter)`. This is a genuine HTTP round-trip
> *and* exercises end-to-end client type inference; the elevation client is `vi.mock`ed so it runs fully
> offline (no Mongo, no provider network). No new devDeps needed (`@orpc/client`/`@orpc/server` already present).

## Spec references
- PROJECT-SPEC.md §2 (Vitest + Supertest), §11
- PRD §13 (Quality)

## Implementation steps
1. Spin up the Express app in-test; mock the elevation provider so no network is hit.
2. POST a known polyline → assert the analysis matches the golden fixture (reuse T2.8 fixtures).
3. Assert invalid inputs return the typed VALIDATION error (T3.4 shape).
4. Assert anonymous access works (auth optional).
5. Wire into `pnpm test`.

## Acceptance criteria
- [ ] Happy path returns the expected analysis for a known route.
- [ ] Invalid input → typed validation error with the standard envelope.
- [ ] Runs offline (provider mocked); `pnpm test` green.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/analyze.test.ts`

## WOOLF report mapping
- *Feature Development Process* — verified flagship flow.

## Suggested commit(s)
- `test(routes): supertest integration for routes.analyze`
