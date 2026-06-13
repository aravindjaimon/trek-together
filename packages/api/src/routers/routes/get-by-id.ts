import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { publicProcedure } from "../../index";
import { findVisibleRoute } from "./authz";
import { getByIdInputSchema, routeSchema } from "./route.schema";

/**
 * `routes.getById` (T4.5) — public procedure. A route is visible when it is
 * `isPublic` (anonymous share-by-link, PRD FR-6) or the caller owns it. Anything
 * else — missing, or someone else's private route — is a uniform `NOT_FOUND`, so
 * a private route's existence never leaks.
 */
export const getById = publicProcedure
  .input(getByIdInputSchema)
  .output(routeSchema)
  .handler(async ({ input, context, errors }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const route = await findVisibleRoute(repo, input.id, context.session?.user.id);
    if (!route) {
      throw errors.NOT_FOUND();
    }
    return route;
  });
