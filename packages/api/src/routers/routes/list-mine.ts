import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { protectedProcedure } from "../../index";
import { listMineInputSchema, listMineOutputSchema } from "./route.schema";

/**
 * `routes.listMine` (T4.6) — the signed-in user's own routes, newest first,
 * paginated. Ownership scoping is intrinsic: the query is keyed on the session
 * user id, so there's nothing to leak. `limit` is capped at the schema (100) and
 * again in the repo.
 */
export const listMine = protectedProcedure
  .input(listMineInputSchema)
  .output(listMineOutputSchema)
  .handler(async ({ input, context }) => {
    const repo = createPrismaRoutesRepo(context.db);
    const { items, total } = await repo.listByOwner({
      ownerId: context.session.user.id,
      page: input.page,
      limit: input.limit,
    });
    return { items, total, page: input.page, limit: input.limit };
  });
