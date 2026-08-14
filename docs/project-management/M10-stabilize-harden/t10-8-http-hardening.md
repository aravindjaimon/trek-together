# T10.8 — HTTP hardening: helmet, rate limits, body caps

> No per-IP rate limiting anywhere, no explicit auth brute-force backstop, no security headers, and
> the oRPC handlers buffer request bodies with no byte ceiling.

| Field | Value |
|---|---|
| **Task ID** | T10.8 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | — |
| **Labels** | server, security |

## Context & rationale
`express.json()`'s position is irrelevant for `/rpc` — oRPC's node handler reads the raw stream
itself, so the body cap must be oRPC's `BodyLimitPlugin`. Auth throttling uses Better-Auth's
built-in `rateLimit` (today silently prod-only); `express-rate-limit` is the coarse per-IP backstop.

## Implementation steps
1. `app.use(helmet())` first (API-only defaults).
2. `express-rate-limit`: `{ windowMs: 15m, limit: 300, standardHeaders: true }` before the auth
   mount — covers `/api/auth/*` and `/rpc`.
3. Better-Auth: explicit `rateLimit: { enabled: true, window: 60, max: 20 }`.
4. `BodyLimitPlugin` (from `@orpc/server/node` / `@orpc/openapi` equivalents) with 1 MiB on both
   `RPCHandler` and `OpenAPIHandler`; `express.json({ limit: "100kb" })` stays where it is.

## Acceptance criteria
- [x] >1 MiB `/rpc` body → typed 413, not an unhandled error.
- [x] 21 rapid sign-in attempts → 429.
- [x] Security headers present on every response.

## Definition of Done
- [x] New deps justified (security): `helmet`, `express-rate-limit`.
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/server/src/index.ts`
- `packages/auth/src/index.ts`

## Suggested commit(s)
- `feat(server): helmet, per-IP rate limit, oRPC body caps, auth throttle`
