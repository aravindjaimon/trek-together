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
