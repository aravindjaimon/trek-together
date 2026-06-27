/**
 * Shared types for the routing integration layer — snapping a user's clicked
 * waypoints onto real walking paths ("real trail" planning).
 *
 * Coordinates are WGS84 degrees, same shape as the elevation layer's `LatLng`,
 * which we reuse so the two integrations stay interoperable.
 */

import type { LatLng } from "../elevation/types";

export type { LatLng };

/**
 * Contract implemented by every routing provider client (Mapbox today). Given
 * ≥2 ordered waypoints, return the full snapped geometry that follows real
 * paths between them. Stateless single request — callers layer on nothing else.
 */
export interface RoutingProvider {
  snap(waypoints: LatLng[]): Promise<LatLng[]>;
}

export interface RoutingProviderErrorOptions {
  /** Provider that produced the failure, e.g. `"mapbox"`. */
  provider: string;
  /** Upstream HTTP status, when the failure came from a response. */
  status?: number;
  cause?: unknown;
}

/**
 * Typed error raised by any routing provider client for transport/config/shape
 * failures. Provider clients must never let a raw `fetch`/parse error escape —
 * they wrap it in this so the procedure can branch on a known shape.
 */
export class RoutingProviderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, options: RoutingProviderErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "RoutingProviderError";
    this.provider = options.provider;
    this.status = options.status;
  }
}

/**
 * Raised when the provider succeeds but finds no walkable route between the
 * waypoints (e.g. points over open water). Distinct from a transport failure so
 * the client can fall back to a straight line rather than treating it as an
 * outage.
 */
export class RouteNotFoundError extends Error {
  readonly provider: string;

  constructor(provider: string) {
    super("No walkable route between the given waypoints");
    this.name = "RouteNotFoundError";
    this.provider = provider;
  }
}
