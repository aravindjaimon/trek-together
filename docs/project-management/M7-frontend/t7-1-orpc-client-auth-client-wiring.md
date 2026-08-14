# T7.1 — oRPC client + auth-client wiring

> Wire the typed oRPC client and Better-Auth client in apps/web so the UI gets end-to-end types and sessions.

| Field | Value |
|---|---|
| **Task ID** | T7.1 |
| **Milestone** | M7 — Frontend |
| **Status** | ☑ Done (browser-verified) |
| **Priority** | P0 |
| **Estimate** | 0.5d |
| **Depends on** | T0.5, T0.6 |
| **Blocks** | T7.2, T7.3, T8.1 |
| **Labels** | frontend, api |

## Context & rationale
The web app consumes the server through the typed oRPC client (no duplicated shapes — PROJECT-SPEC.md §11)
and the Better-Auth client for sessions. Getting this plumbing right first unblocks every screen.

## Spec references
- PROJECT-SPEC.md §2 (TanStack Router/Vite), §11 (infer client types)
- PRD §12

## Implementation steps
1. Create `apps/web/src/lib/orpc.ts` — the oRPC client pointed at `VITE_SERVER_URL`, with credentials for cookies.
2. Create `apps/web/src/lib/auth-client.ts` — Better-Auth client.
3. Confirm types flow: calling `routes.analyze` from the client is fully typed off the server router.
4. Add a small query layer (TanStack Query if scaffolded) or thin hooks for calls.
5. Handle the typed error envelope (T3.4) in a shared client helper.

## Acceptance criteria
- [ ] Client calls a server procedure with full input/output types.
- [ ] Auth client can register/login/logout and carries the session cookie.
- [ ] Server URL + credentials configured via env.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/web/src/lib/orpc.ts`, `apps/web/src/lib/auth-client.ts`

## WOOLF report mapping
- *Technologies Used* — end-to-end type safety.

## Suggested commit(s)
- `feat(web): wire orpc + better-auth clients`
