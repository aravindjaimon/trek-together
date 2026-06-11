import { z } from "zod";

import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { protectedProcedure } from "../../index";
import { findOwnedRoute } from "./authz";
import { getByIdInputSchema } from "./route.schema";

/**
 * `routes.remove` (T4.7) — owner-only delete. Non-owners and missing routes both
 * get `NOT_FOUND` (no existence leak). Named `remove` because `delete` is a
 * reserved word; exposed on the router as `routes.remove`.
 */
export const remove = protectedProcedure
  .input(getByIdInputSchema)
  .output(z.object({ id: z.string() }))
  .handler(async ({ input, context, errors }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const owned = await findOwnedRoute(repo, input.id, context.session.user.id);
    if (!owned) {
      throw errors.NOT_FOUND();
    }
    await repo.delete(input.id);
    return { id: input.id };
  });
