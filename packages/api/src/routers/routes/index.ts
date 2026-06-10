import { analyze } from "./analyze";
import { create } from "./create";

/** `routes.*` sub-router. Registered under `routes` in the app router. */
export const routesRouter = {
  analyze,
  create,
};
