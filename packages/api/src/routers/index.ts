import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { logsRouter } from "./logs";
import { routesRouter } from "./routes";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  routes: routesRouter,
  logs: logsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
