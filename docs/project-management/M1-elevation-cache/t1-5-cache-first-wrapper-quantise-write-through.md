# T1.5 — Cache-first wrapper (quantise, write-through)

> Expose getElevations() that serves cached points first and only calls the provider (batched+limited) for misses, writing results back.

| Field | Value |
|---|---|
| **Task ID** | T1.5 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T1.1, T1.4 |
| **Blocks** | T2.2, T3.2 |
| **Labels** | integration, cache, performance |

## Context & rationale
This is the single choke-point all elevation reads go through (PROJECT-SPEC.md §3/§9): quantise → look up
cache → fetch only misses (via T1.3) → write-through → merge. It makes a repeated analysis serve
entirely from cache, which is exactly what the cold-vs-warm benchmark (T3.5) measures.

## Spec references
- PROJECT-SPEC.md §3 (always via cache wrapper), §9
- PRD FR-4, NFR-P3

## Implementation steps
1. Create `apps/server/src/integrations/elevation/cache.ts` exporting `getElevations(points): Promise<ElevationPoint[]>`.
2. Quantise each point to the cache key (same scheme as T1.4); dedupe keys within the request.
3. Read existing keys from `elevationCache` (data-layer repo call); compute the miss set.
4. Fetch misses via the batched + rate-limited provider (T1.3); upsert results (write-through) with `fetchedAt = now`.
5. Return elevations mapped back to the **original** input points/order; expose simple hit/miss counters for the benchmark (T3.5).

## Acceptance criteria
- [x] Second identical call performs **zero** provider requests (all hits).
- [x] Only missing keys are fetched; hits are never re-fetched.
- [x] Output maps 1:1 back to input order; hit/miss counts are observable.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Hit/miss instrumentation in place for T3.5.

## Files & paths
- `apps/server/src/integrations/elevation/cache.ts`
- `apps/server/src/data/elevation-cache.repo.ts`

## WOOLF report mapping
- *Feature Development Process* — the cache step of `routes.analyze`; basis of NFR-P3.

## References
- PROJECT-SPEC.md §9 (caching strategy)

## Suggested commit(s)
- `feat(cache): cache-first elevation wrapper with write-through`
