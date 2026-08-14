# T0.5 — Wire Better-Auth (email/password + sessions)

> Enable email/password registration, login, logout and persistent sessions via Better-Auth's Prisma adapter.

| Field | Value |
|---|---|
| **Task ID** | T0.5 |
| **Milestone** | M0 — Scaffold |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T0.4 |
| **Blocks** | T4.7, T7.1, T7.2 |
| **Labels** | auth |

## Context & rationale
FR-1 requires real auth. Better-Auth provides email/password + sessions out of the box with a Prisma
adapter — PROJECT-SPEC.md §2/§7 explicitly forbid hand-rolling JWT/bcrypt. This task wires the server side;
the UI is T7.2 and authz enforcement on procedures is T4.7.

## Spec references
- PRD FR-1, §12 (`auth.*`), NFR-S2
- PROJECT-SPEC.md §2 (Better-Auth), §7 (auth)

## Implementation steps
1. Confirm/complete `apps/server/src/lib/auth.ts` Better-Auth instance with the Prisma adapter and email/password enabled.
2. Mount the Better-Auth handler on Express (its routes) alongside the oRPC handler (T0.6).
3. Wire `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN` from env (T0.7); enable cookie sessions + CORS credentials.
4. Provide the oRPC context helper that reads the session from the request (used by protected procedures in M4).
5. Manually verify register → login → session cookie → logout with `curl`/REST client; confirm session survives a "reload" (second request with the cookie).

## Acceptance criteria
- [x] Register, login, logout work; a session cookie is issued and accepted. _(curl: sign-up/sign-in → 200 + `better-auth.session_token`; sign-out → 200.)_
- [x] Session persists across requests (reload-equivalent). _(`get-session` with the cookie returns the user; after sign-out → `null`.)_
- [x] oRPC context exposes the authenticated user (or null) to procedures. _(`POST /rpc/privateData` → 200 + user with cookie; 401 `UNAUTHORIZED` without.)_

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo). _(Auth in `@trek-together/auth`; procedure stays thin.)_
- [x] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green. _(Auth flow verified live via curl — register/login/logout/persist/protected/invalid-creds; an automated Supertest suite is M3 T3.6. `pnpm test` green.)_
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [x] No secrets committed; only `.env.example` keys (T0.7). _(`BETTER_AUTH_SECRET` only in git-ignored `.env`.)_

## Completion notes (2026-06-30)
- **Path reconciliation:** auth is `packages/auth/src/index.ts`; context `packages/api/src/context.ts`.
- The only change: **transport-derived cookie attributes**. Cross-site cookies (`sameSite:"none"` + `secure`)
  require HTTPS and never persist over `http://localhost`. Hardening is keyed off the `BETTER_AUTH_URL`
  scheme (**fail-secure**, not `NODE_ENV` — which the env schema defaults to `"development"`, so a forgotten
  `NODE_ENV` in a deployed HTTPS env would otherwise silently downgrade cookies). Verified:
  http base URL → `Set-Cookie: …; HttpOnly; SameSite=Lax` (no `Secure`); https base URL →
  `__Secure-better-auth.session_token; HttpOnly; Secure; SameSite=None`.
- Negative scenarios checked: wrong password → 401; unauthenticated protected access → 401; post-logout session → null.
- **Note for T7:** `CORS_ORIGIN`/`trustedOrigins` is `http://localhost:3001`; confirm the web dev-server origin
  (Vite) matches when wiring the browser auth UI (T7.1/T7.2). Server-side flow here verified via curl.

## Files & paths
- `apps/server/src/lib/auth.ts`, `apps/server/src/lib/context.ts`, `apps/server/src/index.ts`

## WOOLF report mapping
- *Requirement Gathering* (FR-1) · *Technologies Used* (Better-Auth).

## References
- Better-Auth — https://www.better-auth.com/

## Suggested commit(s)
- `feat(auth): wire better-auth email/password + sessions`
