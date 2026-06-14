import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { publicProcedure } from "../../index";
import { exploreInputSchema, exploreOutputSchema } from "./route.schema";

/**
 * `routes.explore` (T6.2) — "routes near me". Public (anyone can discover public
 * routes). Thin adapter: validate + cap the point/radius/pagination (NFR-S1),
 * delegate the `$geoNear` query to the repo, return cards ordered nearest-first
 * with each route's distance from the query point.
 */
export const explore = publicProcedure
  .input(exploreInputSchema)
  .output(exploreOutputSchema)
  .handler(async ({ input, context }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const { items } = await repo.exploreNear({
      lng: input.lng,
      lat: input.lat,
      radiusM: input.radiusM,
      page: input.page,
      limit: input.limit,
    });
    return { items, page: input.page, limit: input.limit };
  });
