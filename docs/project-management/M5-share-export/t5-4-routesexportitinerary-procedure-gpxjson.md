# T5.4 — routes.exportItinerary procedure (gpx|json)

> Expose export via oRPC with a format param, honouring the route's visibility (public anonymous; private owner-only).

| Field | Value |
|---|---|
| **Task ID** | T5.4 |
| **Milestone** | M5 — Share + export |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T5.2, T5.3 |
| **Blocks** | T5.5, T7.7 |
| **Labels** | api, export |

## Context & rationale
FR-8 + §12: one procedure returns GPX or JSON, with access matching the route's visibility (anonymous
for public, owner-only for private). Reuses the builders (T5.2/T5.3).

## Spec references
- PRD FR-8, §12 (`routes.exportItinerary`, visibility-matched)
- PROJECT-SPEC.md §7

## Implementation steps
1. Create `apps/server/src/routers/routes/export.ts` with Zod input `{ id, format: 'gpx' | 'json' }`.
2. Resolve the route via the same visibility rules as `getById` (T4.5/T4.7).
3. Dispatch to `toGpx`/`toItineraryJson`; return the payload with correct content type / filename hint.
4. Reject private exports for non-owners (typed error / NOT_FOUND).

## Acceptance criteria
- [ ] `format=gpx` returns valid GPX; `format=json` returns the itinerary JSON.
- [ ] Public route exportable anonymously; private only by owner.
- [ ] Invalid format rejected (typed validation error).

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).

## Files & paths
- `apps/server/src/routers/routes/export.ts`

## WOOLF report mapping
- *Feature Development Process* · *Requirement Gathering* (FR-8).

## Suggested commit(s)
- `feat(routes): routes.exportItinerary (gpx|json)`
