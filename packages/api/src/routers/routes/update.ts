import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { protectedProcedure } from "../../index";
import { findOwnedRoute } from "./authz";
import { routeSchema, updateRouteInputSchema } from "./route.schema";

/**
 * `routes.update` (T4.7) — owner-only metadata patch (name / description /
 * isPublic). Geometry and analysis are immutable: re-analysing produces a new
 * route, so those fields are not patchable here.
 */
export const update = protectedProcedure
  .input(updateRouteInputSchema)
  .output(routeSchema)
  .handler(async ({ input, context, errors }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const owned = await findOwnedRoute(repo, input.id, context.session.user.id);
    if (!owned) {
      throw errors.NOT_FOUND();
    }
    const { id, ...patch } = input;
    return repo.update(id, patch);
  });
