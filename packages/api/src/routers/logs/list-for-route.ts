import { createPrismaLogsRepo } from "../../data/logs.repo";
import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { publicProcedure } from "../../index";
import { isRouteVisible } from "../routes/authz";
import { listLogsInputSchema, listLogsOutputSchema } from "./log.schema";

/**
 * `logs.listForRoute` (T11.4 / FR-10) — thin public procedure. Returns a route's
 * community logs (paginated, newest-first) plus aggregate stats. Readable
 * anonymously **iff** the route is visible (public, or owned by the caller);
 * otherwise a uniform `NOT_FOUND`, so private-route logs never leak.
 */
export const listForRoute = publicProcedure
  .input(listLogsInputSchema)
  .output(listLogsOutputSchema)
  .handler(async ({ input, context, errors }) => {
    const routesRepo = createPrismaRoutesRepo(context.db);
    if (!(await isRouteVisible(routesRepo, input.routeId, context.session?.user.id))) {
      throw errors.NOT_FOUND();
    }

    const logsRepo = createPrismaLogsRepo(context.db);
    const { items, total, stats } = await logsRepo.listForRoute({
      routeId: input.routeId,
      page: input.page,
      limit: input.limit,
    });
    return {
      items: items.map((log) => ({
        id: log.id,
        userName: log.userName,
        routeId: log.routeId,
        completedOn: log.completedOn,
        actualDurationS: log.actualDurationS,
        rating: log.rating,
        notes: log.notes,
        createdAt: log.createdAt,
      })),
      total,
      stats,
    };
  });
