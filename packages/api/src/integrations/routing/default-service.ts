import { createMapboxRoutingProvider } from "./mapbox";
import type { RoutingProvider } from "./types";

/**
 * Build the production routing client. The single seam the `routes.snap`
 * procedure uses; integration tests can `vi.mock` this module to stay offline.
 *
 * One provider today (Mapbox), which loads its own config lazily from env — so
 * this module has no import-time env dependency. When a second provider lands,
 * switch on `env.ROUTING_PROVIDER` here (import env lazily to keep it so).
 */
export function createDefaultRoutingService(): RoutingProvider {
  return createMapboxRoutingProvider();
}
