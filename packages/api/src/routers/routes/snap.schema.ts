import { z } from "zod";

import { latLngSchema } from "./analyze.schema";

/**
 * Zod contract for `routes.snap` — snap a handful of clicked waypoints onto real
 * walking paths. Reuses `latLngSchema` so the coordinate bounds match the rest
 * of the API.
 */

// ponytail: 25 = Mapbox Directions' per-request coordinate cap. Chunk + stitch
// consecutive segments if longer routes ever need it.
const MAX_WAYPOINTS = 25;

export const snapInputSchema = z.object({
  waypoints: z.array(latLngSchema).min(2).max(MAX_WAYPOINTS),
});

export const snapOutputSchema = z.object({
  /** Full snapped geometry following real paths between the waypoints. */
  path: z.array(latLngSchema),
});

export type SnapInput = z.infer<typeof snapInputSchema>;
export type SnapOutput = z.infer<typeof snapOutputSchema>;
