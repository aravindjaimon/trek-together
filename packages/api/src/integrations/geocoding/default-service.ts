import { createNominatimProvider } from "./nominatim";
import type { GeocodingProvider } from "./types";

/**
 * Build the production geocoding client. The single seam the `places.search`
 * procedure uses; tests can `vi.mock` this module to stay offline.
 *
 * One provider today (Nominatim), which loads its own config lazily from env —
 * so this module has no import-time env dependency. When a second provider
 * lands, switch on `env.GEOCODING_PROVIDER` here (import env lazily to keep it so).
 */
export function createDefaultGeocodingService(): GeocodingProvider {
  return createNominatimProvider();
}
