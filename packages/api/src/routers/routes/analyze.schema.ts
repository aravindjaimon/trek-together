import { z } from "zod";

import type { DifficultyBand } from "../../services/difficulty";

/**
 * Zod contracts for the flagship `routes.analyze` procedure (T3.1). The input is
 * validated at the oRPC boundary (PRD NFR-S1); the output matches PRD FR-3. The
 * inferred types below are reused by the service, procedure, and client — no
 * shape is duplicated.
 */

// Mirrors difficulty.ts `DifficultyBand`; `satisfies` keeps the two in lock-step.
const DIFFICULTY_BANDS = [
  "Easiest",
  "Moderate",
  "Moderately Strenuous",
  "Strenuous",
  "Very Strenuous",
] as const satisfies readonly DifficultyBand[];

// ponytail: caps chosen to bound provider quota + latency (OpenTopoData is
// ~1 req/s, 1000 pts/day). Widen if real routes need denser sampling.
const MAX_VERTICES = 500;
const MIN_SPACING_M = 10;
const MAX_SPACING_M = 1000;
const DEFAULT_SPACING_M = 60;

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const analyzeInputSchema = z.object({
  /** Ordered polyline vertices; densified server-side to `spacingM`. */
  path: z.array(latLngSchema).min(2).max(MAX_VERTICES),
  /** Target sample spacing in metres along the route. */
  spacingM: z.number().min(MIN_SPACING_M).max(MAX_SPACING_M).default(DEFAULT_SPACING_M),
});

export const analyzeOutputSchema = z.object({
  elevationProfile: z.array(
    z.object({
      distanceAlongM: z.number(),
      elevationM: z.number(),
    }),
  ),
  distanceM: z.number(),
  ascentM: z.number(),
  descentM: z.number(),
  estTimeNaismithS: z.number(),
  estTimeToblerS: z.number(),
  difficultyScore: z.number(),
  difficultyBand: z.enum(DIFFICULTY_BANDS),
  /** Optional cache observability (T3.2) — required fields still match FR-3. */
  meta: z
    .object({
      cacheHits: z.number().int().nonnegative(),
      cacheMisses: z.number().int().nonnegative(),
    })
    .optional(),
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;
export type AnalyzeOutput = z.infer<typeof analyzeOutputSchema>;
