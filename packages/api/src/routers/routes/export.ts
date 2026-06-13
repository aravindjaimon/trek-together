import { z } from "zod";

import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { publicProcedure } from "../../index";
import { toGpx } from "../../services/export/gpx";
import { toItineraryJson } from "../../services/export/json";
import { findVisibleRoute } from "./authz";
import { objectIdSchema } from "./route.schema";

/**
 * `routes.exportItinerary` (T5.4) — download a saved route as GPX or JSON.
 * Public procedure with the same visibility as `getById`: public routes export
 * anonymously (share-by-link), private ones only for the owner. Returns a ready
 * payload (content + MIME + filename hint) so the client just saves the file.
 */
export const exportItinerary = publicProcedure
  .input(z.object({ id: objectIdSchema, format: z.enum(["gpx", "json"]) }))
  .output(z.object({ filename: z.string(), contentType: z.string(), content: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const route = await findVisibleRoute(repo, input.id, context.session?.user.id);
    if (!route) {
      throw errors.NOT_FOUND();
    }

    const slug = route.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "route";
    if (input.format === "gpx") {
      return {
        filename: `${slug}.gpx`,
        contentType: "application/gpx+xml",
        content: toGpx(route),
      };
    }
    return {
      filename: `${slug}.json`,
      contentType: "application/json",
      content: JSON.stringify(toItineraryJson(route), null, 2),
    };
  });
