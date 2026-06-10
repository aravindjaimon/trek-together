import { createPrismaRoutesRepo } from "../../data/routes.repo";
import { protectedProcedure } from "../../index";
import { createDefaultElevationService } from "../../integrations/elevation/default-service";
import { ElevationUnavailableError } from "../../integrations/elevation/types";
import { analyzeRoute, RouteTooLargeError } from "../../services/analyze";
import { toLineString } from "../../services/geojson";
import { createRouteInputSchema, routeSchema } from "./route.schema";

/**
 * `routes.create` (T4.4) — analyse the polyline, then persist the result so views
 * and exports never recompute. Thin adapter: auth (protected), analyse via the
 * shared service, store via the repo (data layer owns Prisma, §3). Owner comes
 * from the session, never the client.
 */
export const create = protectedProcedure
  .input(createRouteInputSchema)
  .output(routeSchema)
  .handler(async ({ input, context, errors }) => {
    const elevationClient = createDefaultElevationService({
      db: context.db,
      requestId: context.requestId,
    });

    let analysis: Awaited<ReturnType<typeof analyzeRoute>>;
    try {
      analysis = await analyzeRoute(input.path, elevationClient, { spacingM: input.spacingM });
    } catch (err) {
      if (err instanceof RouteTooLargeError) {
        throw errors.VALIDATION({ message: err.message });
      }
      if (err instanceof ElevationUnavailableError) {
        throw errors.ELEVATION_UNAVAILABLE({ data: { unresolvedCount: err.unresolvedCount } });
      }
      throw err;
    }

    const repo = createPrismaRoutesRepo(context.db);
    return repo.create({
      ownerId: context.session.user.id,
      name: input.name,
      description: input.description ?? null,
      path: toLineString(input.path),
      elevationProfile: analysis.elevationProfile,
      distanceM: analysis.distanceM,
      ascentM: analysis.ascentM,
      descentM: analysis.descentM,
      estTimeNaismithS: analysis.estTimeNaismithS,
      estTimeToblerS: analysis.estTimeToblerS,
      difficultyScore: analysis.difficultyScore,
      difficultyBand: analysis.difficultyBand,
      isPublic: input.isPublic,
    });
  });
