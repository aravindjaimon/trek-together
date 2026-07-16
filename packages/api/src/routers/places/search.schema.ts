import { z } from "zod";

import { latLngSchema } from "../routes/analyze.schema";

/**
 * Zod contract for `places.search` — forward-geocode a free-text place query
 * into ranked coordinates. Reuses `latLngSchema` so the coordinate bounds match
 * the rest of the API.
 */

export const searchInputSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(10).default(5),
});

const geoPlaceSchema = z.object({
  label: z.string(),
  lat: latLngSchema.shape.lat,
  lng: latLngSchema.shape.lng,
  /** Provider-suggested viewport (SW, NE); null for point-only results. */
  boundingBox: z.tuple([latLngSchema, latLngSchema]).nullable(),
});

export const searchOutputSchema = z.object({
  results: z.array(geoPlaceSchema),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchOutput = z.infer<typeof searchOutputSchema>;
