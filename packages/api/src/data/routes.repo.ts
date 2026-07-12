import prisma, { type PrismaClient } from "@trek-together/db";

import type { DifficultyBand } from "../services/difficulty";
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
  difficultyBand: DifficultyBand;
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

export interface ExploreNearArgs {
  lng: number;
  lat: number;
  radiusM: number;
  page: number;
  limit: number;
}

/** A public route near the query point, with its great-circle distance from it. */
export interface ExploreItem extends RouteRecord {
  distanceFromQueryM: number;
}

export interface ExploreNearResult {
  items: ExploreItem[];
}

// ponytail: hard cap so a client can't request an unbounded page. The procedure
// schema also caps; this is the data-layer backstop.
const MAX_LIMIT = 100;

/**
 * Data-layer access to the `routes` collection (T4.3, T6.1). Owns every Prisma
 * call for routes — including the raw `$geoNear` geo query — so services and
 * procedures stay Prisma/Mongo-free (PROJECT-SPEC.md §3).
 */
export interface RoutesRepo {
  create(input: CreateRouteInput): Promise<RouteRecord>;
  findById(id: string): Promise<RouteRecord | null>;
  /**
   * Projected visibility gate — just `ownerId`/`isPublic`, not the whole route.
   * Read gates (`logs.*`) that only decide access must not hydrate the full
   * document (GeoJSON path + up-to-5000-point elevation profile) to test two
   * booleans. Returns `null` when the route doesn't exist.
   */
  findVisibility(id: string): Promise<{ ownerId: string; isPublic: boolean } | null>;
  listByOwner(args: ListByOwnerArgs): Promise<ListByOwnerResult>;
  exploreNear(args: ExploreNearArgs): Promise<ExploreNearResult>;
  update(id: string, patch: UpdateRouteInput): Promise<RouteRecord>;
  delete(id: string): Promise<void>;
}

/** aggregateRaw returns MongoDB Extended JSON — numbers may be wrapped. */
function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("$numberDouble" in o) return Number(o.$numberDouble);
    if ("$numberInt" in o) return Number(o.$numberInt);
    if ("$numberLong" in o) return Number(o.$numberLong);
  }
  return Number(v);
}

/** `_id` comes back as `{ $oid }` (Extended JSON) or, when mocked, a plain string. */
function oid(v: unknown): string {
  if (v && typeof v === "object" && "$oid" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>).$oid);
  }
  return String(v);
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
    // Stored as String in Mongo; the analysis writes only valid bands (T4.4).
    difficultyBand: doc.difficultyBand as DifficultyBand,
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

    async findVisibility(id) {
      return db.route.findUnique({ where: { id }, select: { ownerId: true, isPublic: true } });
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

    async exploreNear({ lng, lat, radiusM, page, limit }) {
      const take = Math.min(Math.max(1, limit), MAX_LIMIT);
      const skip = Math.max(0, (Math.max(1, page) - 1) * take);

      // $geoNear must be the first pipeline stage; coordinates are typed numbers
      // (validated upstream), never string-concatenated (NFR-S1). It filters to
      // public routes within radius, sorts nearest-first, and stamps each doc
      // with its distance — under a distinct field so the route's own distanceM
      // (total length) is not clobbered.
      const rows = (await db.route.aggregateRaw({
        pipeline: [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [lng, lat] },
              distanceField: "distanceFromQueryM",
              spherical: true,
              maxDistance: radiusM,
              query: { isPublic: true },
            },
          },
          { $skip: skip },
          { $limit: take },
          { $project: { _id: 1, distanceFromQueryM: 1 } },
        ],
      })) as unknown as Array<{ _id: unknown; distanceFromQueryM: unknown }>;

      const order = rows.map((r) => ({ id: oid(r._id), dist: num(r.distanceFromQueryM) }));
      if (order.length === 0) return { items: [] };

      // Hydrate full, typed records (path as real GeoJSON) via a normal query,
      // then restore the geo ordering + attach the query distance.
      const docs = await db.route.findMany({ where: { id: { in: order.map((o) => o.id) } } });
      const byId = new Map(docs.map((d) => [d.id, mapRoute(d)]));
      const items = order.flatMap((o) => {
        const rec = byId.get(o.id);
        return rec ? [{ ...rec, distanceFromQueryM: o.dist }] : [];
      });
      return { items };
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
