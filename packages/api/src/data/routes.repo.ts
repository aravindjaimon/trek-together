import prisma, { type PrismaClient } from "@trek-together/db";

import type { GeoJSONLineString } from "../services/geojson";

/** One embedded elevation-profile sample (mirrors the Prisma `ProfilePoint` type). */
export interface ProfilePoint {
  distanceAlongM: number;
  elevationM: number;
}

/** A persisted route as the app sees it — `path` typed as GeoJSON, dates as `Date`. */
export interface RouteRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  path: GeoJSONLineString;
  elevationProfile: ProfilePoint[];
  distanceM: number;
  ascentM: number;
  descentM: number;
  estTimeNaismithS: number;
  estTimeToblerS: number;
  difficultyScore: number;
  difficultyBand: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields a caller supplies to persist a new route (owner + analysis, no id/dates). */
export type CreateRouteInput = Omit<RouteRecord, "id" | "createdAt" | "updatedAt">;

/** Metadata-only patch (T4.7) — geometry/analysis are immutable; re-analyse = new route. */
export interface UpdateRouteInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface ListByOwnerArgs {
  ownerId: string;
  page: number;
  limit: number;
}

export interface ListByOwnerResult {
  items: RouteRecord[];
  total: number;
}

// ponytail: hard cap so a client can't request an unbounded page. The procedure
// schema also caps; this is the data-layer backstop.
const MAX_LIMIT = 100;

/**
 * Data-layer access to the `routes` collection (T4.3). Owns every Prisma call for
 * routes so services/procedures stay Prisma-free (PROJECT-SPEC.md §3). The M6
 * `$geoNear` explore query (T6.1) will land here too, alongside this normal access.
 */
export interface RoutesRepo {
  create(input: CreateRouteInput): Promise<RouteRecord>;
  findById(id: string): Promise<RouteRecord | null>;
  listByOwner(args: ListByOwnerArgs): Promise<ListByOwnerResult>;
  update(id: string, patch: UpdateRouteInput): Promise<RouteRecord>;
  delete(id: string): Promise<void>;
}

type RouteDoc = NonNullable<Awaited<ReturnType<PrismaClient["route"]["findUnique"]>>>;

function mapRoute(doc: RouteDoc): RouteRecord {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name,
    description: doc.description,
    // Stored as opaque Json; the geojson service owns the LineString shape.
    path: doc.path as unknown as GeoJSONLineString,
    elevationProfile: doc.elevationProfile.map((p) => ({
      distanceAlongM: p.distanceAlongM,
      elevationM: p.elevationM,
    })),
    distanceM: doc.distanceM,
    ascentM: doc.ascentM,
    descentM: doc.descentM,
    estTimeNaismithS: doc.estTimeNaismithS,
    estTimeToblerS: doc.estTimeToblerS,
    difficultyScore: doc.difficultyScore,
    difficultyBand: doc.difficultyBand,
    isPublic: doc.isPublic,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Prisma-backed {@link RoutesRepo}. Instantiated at the composition root (a
 * procedure) with the request's Prisma client; defaults to the shared singleton.
 */
export function createPrismaRoutesRepo(db: PrismaClient = prisma): RoutesRepo {
  return {
    async create(input) {
      const doc = await db.route.create({
        data: {
          ownerId: input.ownerId,
          name: input.name,
          description: input.description,
          path: input.path as unknown as object,
          elevationProfile: input.elevationProfile,
          distanceM: input.distanceM,
          ascentM: input.ascentM,
          descentM: input.descentM,
          estTimeNaismithS: input.estTimeNaismithS,
          estTimeToblerS: input.estTimeToblerS,
          difficultyScore: input.difficultyScore,
          difficultyBand: input.difficultyBand,
          isPublic: input.isPublic,
        },
      });
      return mapRoute(doc);
    },

    async findById(id) {
      const doc = await db.route.findUnique({ where: { id } });
      return doc ? mapRoute(doc) : null;
    },

    async listByOwner({ ownerId, page, limit }) {
      const take = Math.min(Math.max(1, limit), MAX_LIMIT);
      const skip = Math.max(0, (Math.max(1, page) - 1) * take);
      const [docs, total] = await Promise.all([
        db.route.findMany({ where: { ownerId }, orderBy: { updatedAt: "desc" }, skip, take }),
        db.route.count({ where: { ownerId } }),
      ]);
      return { items: docs.map(mapRoute), total };
    },

    async update(id, patch) {
      const doc = await db.route.update({ where: { id }, data: patch });
      return mapRoute(doc);
    },

    async delete(id) {
      await db.route.delete({ where: { id } });
    },
  };
}
