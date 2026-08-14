# T3.4 — Typed errors + centralised Express handling

> Adopt one consistent oRPC typed-error shape and a centralised Express handler that never leaks stack traces.

| Field | Value |
|---|---|
| **Task ID** | T3.4 |
| **Milestone** | M3 — routes.analyze end-to-end |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.6 |
| **Blocks** | T3.6 |
| **Labels** | api, reliability |

## Context & rationale
PROJECT-SPEC.md §3/§7 require one consistent error shape and centralized handling; PRD NFR-S/§11 say don't
leak stack traces in production. This makes the elevation fallback (T1.6) and validation errors (T3.1)
surface cleanly to clients.

## Spec references
- PROJECT-SPEC.md §3 (centralized errors), §7, §11
- PRD NFR-R1, §12

## Implementation steps
1. Define a typed error catalogue (e.g. `VALIDATION`, `NOT_FOUND`, `UNAUTHORIZED`, `ELEVATION_UNAVAILABLE`, `INTERNAL`).
2. Map service/domain errors to these typed oRPC errors.
3. Add a final Express error middleware: log full detail server-side (with request id), return a safe shape to the client.
4. Ensure unexpected errors become `INTERNAL` without exposing internals.
5. Document the error shape for the README/OpenAPI (T9.1/T9.6).

## Acceptance criteria
- [ ] All procedures surface the same error envelope.
- [ ] Stack traces never reach the client; full detail is logged with a request id.
- [ ] Known failures map to specific typed errors.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/lib/errors.ts`, `apps/server/src/index.ts` (error middleware)

## WOOLF report mapping
- *Class Diagrams (LLD)* · *Conclusion* — robustness.

## Suggested commit(s)
- `feat(server): typed error shape + centralized error handling`
