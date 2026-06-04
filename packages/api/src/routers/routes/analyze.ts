import { publicProcedure } from "../../index";
import { createDefaultElevationService } from "../../integrations/elevation/default-service";
import { ElevationUnavailableError } from "../../integrations/elevation/types";
import { analyzeRoute, RouteTooLargeError } from "../../services/analyze";
import { analyzeInputSchema, analyzeOutputSchema } from "./analyze.schema";

/**
 * `routes.analyze` — the flagship procedure (T3.3). A thin adapter: validate
 * (Zod), build the cache-backed elevation client from context, call the service,
 * return the typed result. No math, no direct DB access (PROJECT-SPEC.md §3).
 * Auth is optional — it works anonymously.
 */
export const analyze = publicProcedure
  .input(analyzeInputSchema)
  .output(analyzeOutputSchema)
  .handler(async ({ input, context, errors }) => {
    const elevationClient = createDefaultElevationService({
      db: context.db,
      requestId: context.requestId,
    });

    try {
      return await analyzeRoute(input.path, elevationClient, { spacingM: input.spacingM });
    } catch (err) {
      if (err instanceof RouteTooLargeError) {
        throw errors.VALIDATION({ message: err.message });
      }
      if (err instanceof ElevationUnavailableError) {
        throw errors.ELEVATION_UNAVAILABLE({ data: { unresolvedCount: err.unresolvedCount } });
      }
      throw err; // unexpected — surfaced as INTERNAL upstream, without leaking detail
    }
  });
