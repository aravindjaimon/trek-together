# T1.1 — OpenTopoData provider client

> Build a typed client for OpenTopoData that resolves a batch of (lat,lng) points to elevations for a configured dataset.

| Field | Value |
|---|---|
| **Task ID** | T1.1 |
| **Milestone** | M1 — Elevation integration + cache |
| **Status** | ☑ Done |
| **Priority** | P0 |
| **Estimate** | 1d |
| **Depends on** | T0.6 |
| **Blocks** | T1.2, T1.3, T1.5 |
| **Labels** | integration, elevation |

## Context & rationale
OpenTopoData is the primary elevation source (PROJECT-SPEC.md §2, PRD §9). It is rate-limited and
quota-limited, so the client must be small, well-typed, and ready to sit behind the cache (T1.5) and
limiter (T1.3) — services must **never** call it directly (PROJECT-SPEC.md §3). Lives in `integrations/`.

## Spec references
- PROJECT-SPEC.md §3 (integrations layer), §16 (API limits)
- PRD §9 (sampling), FR-4

## Implementation steps
1. Create `apps/server/src/integrations/elevation/opentopodata.ts` exporting
   `lookup(points: LatLng[]): Promise<ElevationPoint[]>`.
2. POST/GET to `${OPENTOPODATA_BASE_URL}/${OPENTOPODATA_DATASET}` with `locations=lat,lng|lat,lng…` (read base URL + dataset from env, T0.7).
3. Parse the `results[]` payload into `{ lat, lng, elevationM, dataset }`; validate the response with Zod.
4. Set a descriptive `User-Agent` (NFR-S3 courtesy) and a sane timeout; map non-200/`null` elevations to a typed error.
5. Keep the client **stateless** — batching, rate limiting and caching are separate concerns (T1.3/T1.5).

## Acceptance criteria
- [x] `lookup()` returns elevations for a small known set of coordinates (manual smoke against the public API → live POST `27.9881,86.925` ⇒ 8731 m, `0,0` ⇒ `null`).
- [x] Dataset + base URL come from env; default dataset `srtm30m` (`createOpenTopoDataProvider` resolves `OPENTOPODATA_BASE_URL`/`OPENTOPODATA_DATASET` from `@trek-together/env/server` when not injected).
- [x] Malformed/`null`/non-200 responses raise a typed `ElevationProviderError` (not a raw fetch/Zod error) — `null` *elevation* is a valid out-of-bounds value and is preserved, not an error.

## Definition of Done
- [x] Code follows the layering rules in PROJECT-SPEC.md §3 — pure integration client, no Prisma/Mongo, no procedure logic; lives in the integrations layer.
- [x] `pnpm check-types` and `pnpm lint` pass (Biome clean; Husky pre-commit stays green).
- [x] New/affected logic covered by Vitest; `pnpm test` green (9 cases, HTTP mocked, no network).
- [x] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [x] Unit-tested with a mocked HTTP layer (injected `fetch`; shared pattern with T1.7).

## Files & paths
> **Path note:** placed under `packages/api` (not `apps/server`) per CLAUDE.md's layering reconciliation —
> the scaffold centralises the API in `packages/api`; `apps/server` stays a thin HTTP entrypoint.
- `packages/api/src/integrations/elevation/opentopodata.ts` — `createOpenTopoDataProvider(config?).lookup()`
- `packages/api/src/integrations/elevation/types.ts` — `LatLng`, `ElevationPoint`, `ElevationProviderError`
- `packages/api/src/integrations/elevation/opentopodata.test.ts` — Vitest suite (HTTP mocked)

## Implementation notes (decisions for the report — T9.4)
- **Transport:** Node 24 global `fetch` via an injectable `config.fetch` (no new dependency; deterministic
  tests without global stubbing). Env defaults are read through a lazy dynamic import so unit tests stay
  hermetic.
- **Verb:** `POST {baseUrl}/{dataset}` with JSON `{ "locations": "lat,lng|lat,lng" }` (batch-friendly for
  T1.3; avoids URL-length limits). Descriptive `User-Agent` + 10s `AbortSignal.timeout`.
- **Validation:** response parsed with a Zod schema; any non-OK / non-2xx / malformed / count-mismatch /
  transport failure is wrapped as `ElevationProviderError` carrying `provider` + upstream `status`.
- **Scope:** stateless single-request client only — batching/limiter (T1.3), cache (T1.5), and the shared
  provider interface/factory (T1.2) are deliberately out of scope here.

## WOOLF report mapping
- *Feature Development Process* — the external dependency behind `routes.analyze`.

## References
- OpenTopoData API — https://www.opentopodata.org/api/ (100 locations/request, 1 call/s, 1000/day public)

## Suggested commit(s)
- `feat(elevation): opentopodata client with zod-validated responses`
