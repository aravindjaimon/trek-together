import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { logsRouter } from "./logs";
import { placesRouter } from "./places";
import { routesRouter } from "./routes";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  routes: routesRouter,
  logs: logsRouter,
  places: placesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
