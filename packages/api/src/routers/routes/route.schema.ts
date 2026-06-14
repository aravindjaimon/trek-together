import { z } from "zod";

import { analyzeInputSchema, difficultyBandSchema, elevationProfileSchema } from "./analyze.schema";

/**
 * Zod contracts for the persisted `routes.*` procedures (T4.4–T4.7). The output
 * `routeSchema` is the durable analysis (mirrors the Prisma `Route` model) plus
 * identity + ownership + timestamps. Shapes are inferred once and reused by the
 * procedures and client — nothing is hand-duplicated.
 */

const MAX_NAME = 120;
const MAX_DESCRIPTION = 2000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** GeoJSON LineString as stored in the `path` Json field ([lng,lat] order). */
export const geoJsonLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
});

/** A 24-char hex Mongo ObjectId — validated so malformed ids fail fast (not in Prisma). */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

/** Create = analyze input (path + spacingM) plus the user-supplied metadata. */
export const createRouteInputSchema = analyzeInputSchema.extend({
  name: z.string().trim().min(1).max(MAX_NAME),
  description: z.string().trim().max(MAX_DESCRIPTION).nullish(),
  isPublic: z.boolean().default(false),
});

/** The persisted route as returned to clients. */
export const routeSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  path: geoJsonLineStringSchema,
  elevationProfile: elevationProfileSchema,
  distanceM: z.number(),
  ascentM: z.number(),
  descentM: z.number(),
  estTimeNaismithS: z.number(),
  estTimeToblerS: z.number(),
  difficultyScore: z.number(),
  difficultyBand: difficultyBandSchema,
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getByIdInputSchema = z.object({ id: objectIdSchema });

export const listMineInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const listMineOutputSchema = z.object({
  items: z.array(routeSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

const DEFAULT_RADIUS_M = 25_000;
const MAX_RADIUS_M = 200_000;

/** `routes.explore` (T6.2) — a point, a capped radius, and pagination. */
export const exploreInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusM: z.number().positive().max(MAX_RADIUS_M).default(DEFAULT_RADIUS_M),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/** A route card as returned by explore: the public route plus its distance from the query point. */
export const exploreItemSchema = routeSchema.extend({
  distanceFromQueryM: z.number().nonnegative(),
});

export const exploreOutputSchema = z.object({
  items: z.array(exploreItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

/** Owner-only metadata patch (T4.7); geometry/analysis are immutable. */
export const updateRouteInputSchema = z.object({
  id: objectIdSchema,
  name: z.string().trim().min(1).max(MAX_NAME).optional(),
  description: z.string().trim().max(MAX_DESCRIPTION).nullish(),
  isPublic: z.boolean().optional(),
});

export type CreateRouteInputDTO = z.infer<typeof createRouteInputSchema>;
export type RouteDTO = z.infer<typeof routeSchema>;
