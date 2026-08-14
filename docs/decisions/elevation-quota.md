# Elevation Quota Strategy

**Decision date:** 2026-07-11
**Status:** Accepted (T10.6)

## Context

Both elevation providers are free public hosts with hard quotas: OpenTopoData
allows ~1 req/s and ~1000 calls/day per source IP (100 points/request);
Open-Elevation's public host tolerates roughly ~1000 requests/month. The M1
limiter spaced batches *within one request only* — it was created per call, so
N concurrent users produced N parallel 1 req/s chains from one server IP, and
`Promise.all` kept firing queued batches after one had already failed. Nothing
tracked the daily ceiling: after upstream exhaustion every cold analyze failed
with no local knowledge of why.

## Options considered

| Option | Effect | Verdict |
|---|---|---|
| Process-global limiter + local daily budget + retry-once | Whole server honours 1 req/s; 1001st call fails fast locally; transient 429/5xx get one polite retry | **Chosen** — app-level only, free |
| Self-hosted OpenTopoData | No quota, but an ops component + multi-GB SRTM download | Deferred — revisit when the 1000/day ceiling actually binds |
| Paid provider (e.g. Google Elevation) | No quota, costs money + key management | Rejected for now (user decision 2026-07-11) |

## Decision

1. **Process-global rate limiter** (`batched-lookup.ts`): one serial chain per
   provider name — all concurrent requests share it, so the server as a whole
   stays ≤1 req/s per host.
2. **Sequential batches, fail-fast**: batches run in order; the first hard
   failure stops the run instead of burning queued quota.
3. **Retry-once** on 429/502/503/504, honouring `Retry-After` (capped at 10 s).
4. **Local daily budget** (`quota.ts`): in-memory per-provider counter keyed by
   UTC day; `OPENTOPODATA_DAILY_LIMIT` (default 1000). At the ceiling the client
   fails typed *without* touching the network, flowing through the existing
   fallback → `ELEVATION_UNAVAILABLE` degradation. In-memory is deliberate: the
   server is single-process; move to Mongo if that changes.

## Consequences

- The **~1000/day ceiling remains a documented product limit**: roughly 100–200
  cold route analyses per day across all users (cache hits are unlimited — the
  30-day cache TTL is what makes this budget workable).
- Counter resets on restart — after a redeploy the local budget can briefly
  exceed upstream reality; the 429 retry + fallback path absorbs that.
- Open-Elevation's monthly quota is not counted (no daily meaning); it remains
  fallback-only.
