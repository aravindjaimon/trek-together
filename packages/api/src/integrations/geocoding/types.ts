/**
 * Shared types for the geocoding integration layer — turning a typed place name
 * ("Old Rag", "Yosemite Valley") into map coordinates so the planner/explorer
 * can fly the view there.
 *
 * Coordinates are WGS84 degrees, same shape as the elevation layer's `LatLng`,
 * which we reuse so the geo integrations stay interoperable.
 */

import type { LatLng } from "../elevation/types";

export type { LatLng };

/**
 * One geocoded place. `boundingBox` is the provider's suggested viewport
 * (SW + NE corners) when available, so the client can fit the map tightly; it
 * is `null` for point-only results, where the client zooms to the single point.
 */
export interface GeoPlace {
  label: string;
  lat: number;
  lng: number;
  boundingBox: [LatLng, LatLng] | null;
}

/**
 * Contract implemented by every geocoding provider client (Nominatim today).
 * Stateless single request; returns up to `limit` ranked matches (possibly empty).
 */
export interface GeocodingProvider {
  search(query: string, limit: number): Promise<GeoPlace[]>;
}

export interface GeocodingProviderErrorOptions {
  /** Provider that produced the failure, e.g. `"nominatim"`. */
  provider: string;
  /** Upstream HTTP status, when the failure came from a response. */
  status?: number;
  cause?: unknown;
}

/**
 * Typed error raised by any geocoding provider client for transport/config/shape
 * failures. Provider clients must never let a raw `fetch`/parse error escape —
 * they wrap it in this so the procedure can branch on a known shape. (Mirrors
 * `RoutingProviderError`.)
 */
export class GeocodingProviderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, options: GeocodingProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "GeocodingProviderError";
    this.provider = options.provider;
    this.status = options.status;
  }
}
