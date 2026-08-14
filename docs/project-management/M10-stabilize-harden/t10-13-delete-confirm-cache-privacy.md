# T10.13 — Delete confirmation + clear persisted cache on sign-out

> One misclick permanently deletes a saved route (Delete sits beside the export buttons); the
> persisted query cache (incl. private routes) survives sign-out on shared devices.

| Field | Value |
|---|---|
| **Task ID** | T10.13 |
| **Milestone** | M10 — Stabilize & Harden |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | — |
| **Blocks** | — |
| **Labels** | web, privacy |

## Implementation steps
1. `r.$id.tsx`: two-step confirm — first click arms the button ("Really delete?"), second click
   deletes; disarms after 4s. (No dialog primitive exists in `packages/ui`; adding one for a single
   confirm wasn't warranted.)
2. Sign-out in `header.tsx`: `await signOut()` → `queryClient.clear()` → remove the persisted
   cache entry → navigate. Export the persister from where it's created so header can reach it.
3. Note the accepted residual: data persisted *while* signed in stays until sign-out — inherent to
   offline support.

## Acceptance criteria
- [x] Delete requires an explicit confirm; cancel leaves the route untouched.
- [x] After sign-out, localStorage holds no cached private route data.

## Definition of Done
- [x] `pnpm check-types` / `pnpm lint` / `pnpm test` green.
- [x] Committed in small, dated, Conventional-Commit units.

## Files & paths
- `apps/web/src/routes/r.$id.tsx` · `apps/web/src/components/header.tsx` · `apps/web/src/main.tsx`

## Suggested commit(s)
- `fix(web): confirm route deletion; purge persisted cache on sign-out`
