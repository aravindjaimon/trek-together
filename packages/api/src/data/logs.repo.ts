import prisma, { type PrismaClient } from "@trek-together/db";

/** A persisted trek log as the app sees it — dates as `Date`. */
export interface TrekLogRecord {
  id: string;
  userId: string;
  userName: string;
  routeId: string;
  completedOn: Date;
  actualDurationS: number;
  rating: number;
  notes: string | null;
  createdAt: Date;
}

/** Fields a caller supplies to persist a new log (author from session, no id/createdAt). */
export type CreateTrekLogInput = Omit<TrekLogRecord, "id" | "createdAt">;

export interface ListForRouteArgs {
  routeId: string;
  page: number;
  limit: number;
}

/** Per-route aggregate stats (SPEC §5.6). `count` 0 → averages null (no logs). */
export interface RouteLogStats {
  count: number;
  avgRating: number | null;
  avgActualDurationS: number | null;
}

export interface ListForRouteResult {
  items: TrekLogRecord[];
  total: number;
  stats: RouteLogStats;
}

// ponytail: data-layer backstop on page size; the procedure schema also caps.
const MAX_LIMIT = 50;

/**
 * Data-layer access to the `trekLogs` collection (T11.3). Owns every Prisma call
 * for logs — including the raw `$group` stats aggregation — so services and
 * procedures stay Prisma/Mongo-free (PROJECT-SPEC.md §3).
 */
export interface LogsRepo {
  create(input: CreateTrekLogInput): Promise<TrekLogRecord>;
  listForRoute(args: ListForRouteArgs): Promise<ListForRouteResult>;
  statsForRoute(routeId: string): Promise<RouteLogStats>;
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

/**
 * Decode one `$group` stats row (Extended JSON) into plain numbers. Exported for
 * unit testing — the `$avg` fields come back as `{ $numberDouble }` wrappers,
 * and are `null` when the group is empty. Pure; no DB.
 */
export function mapStats(row: {
  count?: unknown;
  avgRating?: unknown;
  avgActualDurationS?: unknown;
}): RouteLogStats {
  const count = row.count === undefined ? 0 : num(row.count);
  return {
    count,
    avgRating: count > 0 && row.avgRating != null ? num(row.avgRating) : null,
    avgActualDurationS:
      count > 0 && row.avgActualDurationS != null ? num(row.avgActualDurationS) : null,
  };
}

const EMPTY_STATS: RouteLogStats = { count: 0, avgRating: null, avgActualDurationS: null };

type LogDoc = NonNullable<Awaited<ReturnType<PrismaClient["trekLog"]["findUnique"]>>>;

function mapLog(doc: LogDoc): TrekLogRecord {
  return {
    id: doc.id,
    userId: doc.userId,
    userName: doc.userName,
    routeId: doc.routeId,
    completedOn: doc.completedOn,
    actualDurationS: doc.actualDurationS,
    rating: doc.rating,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

/**
 * Prisma-backed {@link LogsRepo}. Instantiated at the composition root (a
 * procedure) with the request's Prisma client; defaults to the shared singleton.
 */
export function createPrismaLogsRepo(db: PrismaClient = prisma): LogsRepo {
  // Closure-local so listForRoute can reuse it without a fragile `this` binding.
  async function statsForRoute(routeId: string): Promise<RouteLogStats> {
    // routeId is a BSON ObjectId in Mongo; match it via Extended JSON in the raw
    // pipeline. Typed value from a validated ObjectId string (NFR-S1).
    const rows = (await db.trekLog.aggregateRaw({
      pipeline: [
        { $match: { routeId: { $oid: routeId } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            avgActualDurationS: { $avg: "$actualDurationS" },
          },
        },
      ],
    })) as unknown as Array<{
      count?: unknown;
      avgRating?: unknown;
      avgActualDurationS?: unknown;
    }>;

    const row = rows[0];
    return row ? mapStats(row) : EMPTY_STATS;
  }

  return {
    async create(input) {
      const doc = await db.trekLog.create({
        data: {
          userId: input.userId,
          userName: input.userName,
          routeId: input.routeId,
          completedOn: input.completedOn,
          actualDurationS: input.actualDurationS,
          rating: input.rating,
          notes: input.notes,
        },
      });
      return mapLog(doc);
    },

    async listForRoute({ routeId, page, limit }) {
      const take = Math.min(Math.max(1, limit), MAX_LIMIT);
      const skip = Math.max(0, (Math.max(1, page) - 1) * take);
      const [docs, total, stats] = await Promise.all([
        // Newest-first, served by the [routeId, createdAt desc] compound index.
        db.trekLog.findMany({ where: { routeId }, orderBy: { createdAt: "desc" }, skip, take }),
        db.trekLog.count({ where: { routeId } }),
        statsForRoute(routeId),
      ]);
      return { items: docs.map(mapLog), total, stats };
    },

    statsForRoute,
  };
}
