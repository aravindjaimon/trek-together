import { z } from "zod";

import { objectIdSchema } from "../routes/route.schema";

/**
 * Zod contracts for `logs.*` (T11.4 / FR-10). Bounds enforced here at the oRPC
 * boundary (NFR-S1); the Prisma model stores raw values (see trek-log.prisma).
 */

const MAX_DURATION_S = 7 * 24 * 60 * 60; // a 7-day ceiling on a single trek
const MAX_NOTES = 2000;
const MAX_LIST_LIMIT = 50;

export const createLogInputSchema = z.object({
  routeId: objectIdSchema,
  /** Date the trek was completed; must not be in the future. */
  completedOn: z.coerce.date().refine((d) => d.getTime() <= Date.now(), {
    message: "completedOn cannot be in the future",
  }),
  /** How long it actually took, seconds (0 < d ≤ 7 days). */
  actualDurationS: z.number().positive().max(MAX_DURATION_S),
  rating: z.number().int().min(1).max(5),
  notes: z.string().max(MAX_NOTES).nullish(),
});

export const listLogsInputSchema = z.object({
  routeId: objectIdSchema,
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(MAX_LIST_LIMIT).default(20),
});

/** One log as returned to clients (SI seconds; ISO dates via serialization). */
export const logSchema = z.object({
  id: z.string(),
  userName: z.string(),
  routeId: z.string(),
  completedOn: z.date(),
  actualDurationS: z.number(),
  rating: z.number().int(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const routeLogStatsSchema = z.object({
  count: z.number().int().nonnegative(),
  avgRating: z.number().nullable(),
  avgActualDurationS: z.number().nullable(),
});

export const listLogsOutputSchema = z.object({
  items: z.array(logSchema),
  total: z.number().int().nonnegative(),
  stats: routeLogStatsSchema,
});

export type CreateLogInput = z.infer<typeof createLogInputSchema>;
export type ListLogsInput = z.infer<typeof listLogsInputSchema>;
