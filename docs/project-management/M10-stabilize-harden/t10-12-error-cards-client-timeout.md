# T10.12 — Error cards on Explore/My Routes + 60s client timeout

> A failed API call renders Explore as "No public routes here yet" and My Routes as a blank page —
> a hard failure masquerading as an empty state. A hung provider freezes buttons forever.

| Field | Value |
|---|---|
| **Task ID** | T10.12 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | T10.14 |
| **Labels** | web, errors |

## Implementation steps
1. Copy the error-card pattern from `r.$id.tsx` (query error → titled card + retry) into
   `explore.tsx` and `routes.tsx`; the empty state renders only on a *successful* empty result.
2. `utils/orpc.ts` link fetch: `signal: options?.signal ?? AbortSignal.timeout(60_000)` — 60s
   because a cold multi-batch analyze can legitimately take ~50s at 1 req/s.

## Acceptance criteria
- [x] Server down: Explore and My Routes show an error card with retry — never the empty state.
- [x] A hung request aborts at 60s and surfaces the normal error path (no eternal spinner).

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/{explore,routes}.tsx` · `apps/web/src/utils/orpc.ts`

## Suggested commit(s)
- `fix(web): real error states on explore/my-routes; 60s request timeout`
