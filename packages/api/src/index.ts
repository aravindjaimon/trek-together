import { os } from "@orpc/server";

import type { Context } from "./context";
import { errorCatalogue } from "./errors";

export const o = os.$context<Context>().errors(errorCatalogue);

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next, errors }) => {
  if (!context.session?.user) {
    throw errors.UNAUTHORIZED();
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
