import type { RouteRecord } from "../../data/routes.repo";

/** Bump when the exported shape changes incompatibly. Documented in docs/api/itinerary.schema.json. */
export const ITINERARY_SCHEMA_VERSION = "1.0";

export interface ItineraryJson {
  version: string;
  name: string;
  description: string | null;
  path: RouteRecord["path"];
  elevationProfile: RouteRecord["elevationProfile"];
  distanceM: number;
  ascentM: number;
  descentM: number;
  estTimeNaismithS: number;
  estTimeToblerS: number;
  difficultyScore: number;
  difficultyBand: string;
}

/**
 * Serialize a saved route to a self-contained JSON itinerary (T5.3): everything
 * the app knows about a route in one offline file (PWA cache / re-import). Pure,
 * version-tagged, no network. Owner/id/timestamps are intentionally omitted —
 * an itinerary is portable data, not an account-scoped record.
 */
export function toItineraryJson(route: RouteRecord): ItineraryJson {
  return {
    version: ITINERARY_SCHEMA_VERSION,
    name: route.name,
    description: route.description,
    path: route.path,
    elevationProfile: route.elevationProfile,
    distanceM: route.distanceM,
    ascentM: route.ascentM,
    descentM: route.descentM,
    estTimeNaismithS: route.estTimeNaismithS,
    estTimeToblerS: route.estTimeToblerS,
    difficultyScore: route.difficultyScore,
    difficultyBand: route.difficultyBand,
  };
}
