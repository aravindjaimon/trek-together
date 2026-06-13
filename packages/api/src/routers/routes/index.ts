import { analyze } from "./analyze";
import { create } from "./create";
import { remove } from "./delete";
import { exportItinerary } from "./export";
import { getById } from "./get-by-id";
import { listMine } from "./list-mine";
import { update } from "./update";

/** `routes.*` sub-router. Registered under `routes` in the app router. */
export const routesRouter = {
  analyze,
  create,
  getById,
  listMine,
  update,
  remove,
  exportItinerary,
};
