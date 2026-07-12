import { createPrismaLogsRepo, type TrekLogRecord } from "../../data/logs.repo";
import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { protectedProcedure } from "../../index";
import { isRouteVisible } from "../routes/authz";
import { createLogInputSchema, logSchema } from "./log.schema";

/** Strip the internal `userId`; clients see the display `userName` only. */
function toPublicLog(log: TrekLogRecord) {
  return {
    id: log.id,
    userName: log.userName,
    routeId: log.routeId,
    completedOn: log.completedOn,
    actualDurationS: log.actualDurationS,
    rating: log.rating,
    notes: log.notes,
    createdAt: log.createdAt,
  };
}

/**
 * `logs.create` (T11.4 / FR-10) — thin protected procedure. Log a completed trek
 * on a route the caller can see. Author identity comes from the session, never
 * the client; a route that isn't visible to the caller is a uniform `NOT_FOUND`
 * (no existence leak, reusing the routes read gate).
 */
export const create = protectedProcedure
  .input(createLogInputSchema)
  .output(logSchema)
  .handler(async ({ input, context, errors }) => {
    const routesRepo = createPrismaRoutesRepo(context.db);
    if (!(await isRouteVisible(routesRepo, input.routeId, context.session.user.id))) {
      throw errors.NOT_FOUND();
    }

    const logsRepo = createPrismaLogsRepo(context.db);
    const log = await logsRepo.create({
      userId: context.session.user.id,
      userName: context.session.user.name,
      routeId: input.routeId,
      completedOn: input.completedOn,
      actualDurationS: input.actualDurationS,
      rating: input.rating,
      notes: input.notes ?? null,
    });
    return toPublicLog(log);
  });
