# T10.10 — Request logging + quiet expected errors

> Every expected 401/404/validation error is `console.error`'d at the same level as real faults;
> the per-request `requestId` never reaches the Express layer, so client errors can't be correlated.

| Field | Value |
|---|---|
| **Task ID** | T10.10 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T10.9 |
| **Blocks** | — |
| **Labels** | server, ops |

## Implementation steps
1. Early middleware: `x-request-id` header or `randomUUID()` → `res.locals` + response header;
   `context.ts` consumes the same id so oRPC and Express share one.
2. One-line JSON request log on `res.on("finish")`: `{ts, requestId, method, path, status, ms}`.
3. `onError` interceptors: skip `ORPCError` codes UNAUTHORIZED / NOT_FOUND / BAD_REQUEST /
   VALIDATION; log the rest with requestId.

## Acceptance criteria
- [x] A failed sign-in produces a request log line but no error log.
- [x] An INTERNAL error logs with the same requestId the client received in headers.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/server/src/index.ts`
- `packages/api/src/context.ts`

## Suggested commit(s)
- `feat(server): shared request ids + JSON request log; quiet expected errors`
