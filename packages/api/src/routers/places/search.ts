import { publicProcedure } from "../../index";
import { createDefaultGeocodingService } from "../../integrations/geocoding/default-service";
import { GeocodingProviderError } from "../../integrations/geocoding/types";
import { searchInputSchema, searchOutputSchema } from "./search.schema";

/**
 * `places.search` — forward-geocode a typed place name into coordinates so the
 * map view can fly there. Thin adapter: validate (Zod), query the configured
 * provider, return ranked matches. Public (searching is anonymous, like `snap`).
 * Any provider/transport failure maps to `GEOCODING_UNAVAILABLE`; an empty result
 * set is a normal success (the client shows "no matches").
 */
export const search = publicProcedure
  .input(searchInputSchema)
  .output(searchOutputSchema)
  .handler(async ({ input, errors }) => {
    const geocoding = createDefaultGeocodingService();
    try {
      const results = await geocoding.search(input.q, input.limit);
      return { results };
    } catch (err) {
      if (err instanceof GeocodingProviderError) {
        throw errors.GEOCODING_UNAVAILABLE();
      }
      throw err; // unexpected — surfaced as INTERNAL upstream, without leaking detail
    }
  });
