# T1.7 — Unit tests (client, limiter, cache; HTTP mocked)

> Cover the elevation client, batching/limiter, and cache wrapper with deterministic unit tests using mocked HTTP and a fake clock.

| Field | Value |
|---|---|
| **Task ID** | T1.7 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T1.5 |
| **Blocks** | — |
| **Labels** | testing |

## Context & rationale
NFR-M1 + the project's testing goal (PROJECT-SPEC.md §2/§11) require meaningful coverage. The elevation
layer must be tested **without** hitting the public API: mock HTTP, fake timers for the limiter, and an
in-memory/temp Mongo (or mocked repo) for the cache.

## Spec references
- PROJECT-SPEC.md §2 (Vitest), §11 (unit tests)
- PRD NFR-M1, §13 (Quality)

## Implementation steps
1. Mock the HTTP layer; assert request shaping (locations payload, dataset, batch boundaries at 100).
2. Test the limiter with fake timers: N calls take ≥ (N−1)s spacing.
3. Test the cache wrapper: cold (all miss → fetch+write), warm (all hit → zero fetch), partial (mixed).
4. Test response validation: malformed/`null`/non-200 → typed error.
5. Wire into `pnpm test`; aim for high coverage of `integrations/elevation/*`.

## Acceptance criteria
- [x] `pnpm test` passes with no network access.
- [x] Cold/warm/partial cache paths each asserted (incl. zero-fetch on warm).
- [x] Batch boundary (101 points → 2 requests) and limiter spacing asserted.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Coverage report noted; fixtures reusable by T3.6.

## Files & paths
- `apps/server/src/integrations/elevation/*.test.ts`

## WOOLF report mapping
- *Feature Development Process* / *Conclusion* — test strategy evidence.

## Suggested commit(s)
- `test(elevation): client, limiter, and cache unit tests`
