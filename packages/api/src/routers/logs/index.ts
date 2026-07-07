import { create } from "./create";
import { listForRoute } from "./list-for-route";

/** `logs.*` sub-router (T11.4). Registered under `logs` in the app router. */
export const logsRouter = {
  create,
  listForRoute,
};
