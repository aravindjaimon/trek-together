import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { routesRouter } from "./routes";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  routes: routesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
