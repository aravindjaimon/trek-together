/**
 * Shared types for the elevation integration layer.
 *
 * Coordinates are WGS84 degrees; elevations are metres above sea level (SI,
 * suffixed `M` per the repo's unit-naming convention). `elevationM` is `null`
 * when a point falls outside the provider dataset's bounds — callers must
 * preserve that distinction rather than coercing it to `0`.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevationM: number | null;
  dataset: string;
}

/**
 * Shared contract implemented by every provider client (OpenTopoData, T1.1;
 * Open-Elevation, T1.2). The cache wrapper (T1.5) and fallback (T1.6) depend on
 * this interface rather than a concrete client, so they can switch providers
 * without caring which one answers. `lookup` is a stateless single request —
 * batching (≤100/req) and rate limiting (≤1 req/s) are layered on separately
 * (T1.3).
 */
export interface ElevationProvider {
  lookup(points: LatLng[]): Promise<ElevationPoint[]>;
}

export interface ElevationProviderErrorOptions {
  /** Provider that produced the failure, e.g. `"opentopodata"`. */
  provider: string;
  /** Upstream HTTP status, when the failure came from a response. */
  status?: number;
  cause?: unknown;
}

/**
 * Typed error raised by any elevation provider client. Provider clients must
 * never let a raw `fetch`/parse error escape — they wrap it in this so callers
 * (the cache wrapper, T1.5; fallback, T1.6) can branch on a known shape.
 */
export class ElevationProviderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, options: ElevationProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ElevationProviderError";
    this.provider = options.provider;
    this.status = options.status;
  }
}

export interface ElevationUnavailableErrorOptions {
  /** Points that WERE resolved (from cache), in input order — a partial result. */
  resolved: ElevationPoint[];
  /** How many requested points could not be resolved by any provider. */
  unresolvedCount: number;
  cause?: unknown;
}

/**
 * Raised by the cache wrapper (T1.6) when cache misses cannot be fetched from
 * any provider. Carries the points that *were* resolved from cache so the
 * procedure can decide between a partial result and a hard failure. The message
 * is deliberately user-safe (no upstream detail / stack) — the underlying
 * provider error is attached as `cause` for server-side logging only.
 */
export class ElevationUnavailableError extends Error {
  readonly code = "ELEVATION_UNAVAILABLE" as const;
  readonly resolved: ElevationPoint[];
  readonly unresolvedCount: number;

  constructor(options: ElevationUnavailableErrorOptions) {
    super("Elevation data is temporarily unavailable", { cause: options.cause });
    this.name = "ElevationUnavailableError";
    this.resolved = options.resolved;
    this.unresolvedCount = options.unresolvedCount;
  }
}
