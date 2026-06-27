import { publicProcedure } from "../../index";
import { createDefaultRoutingService } from "../../integrations/routing/default-service";
import { RouteNotFoundError, RoutingProviderError } from "../../integrations/routing/types";
import { snapInputSchema, snapOutputSchema } from "./snap.schema";

/**
 * `routes.snap` — snap clicked waypoints onto real walking paths so the planner
 * draws and analyses the actual trail, not a straight chord. Thin adapter:
 * validate (Zod), route via the configured provider, return the geometry. Auth
 * is optional (planning is anonymous, like `analyze`). Any provider failure —
 * including a missing token or no walkable route — maps to `ROUTING_UNAVAILABLE`
 * so the client can fall back to a straight line.
 */
export const snap = publicProcedure
  .input(snapInputSchema)
  .output(snapOutputSchema)
  .handler(async ({ input, errors }) => {
    const routing = createDefaultRoutingService();
    try {
      const path = await routing.snap(input.waypoints);
      return { path };
    } catch (err) {
      if (err instanceof RouteNotFoundError || err instanceof RoutingProviderError) {
        throw errors.ROUTING_UNAVAILABLE();
      }
      throw err; // unexpected — surfaced as INTERNAL upstream, without leaking detail
    }
  });
