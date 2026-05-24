import prisma, { type PrismaClient } from "@trek-together/db";

/**
 * A single cached elevation point. `dataset` is the logical key-namespace (the
 * configured primary dataset); `source` is the provider/dataset that actually
 * answered (provenance). `elevationM` is null for out-of-bounds points.
 */
export interface ElevationCacheRow {
  key: string;
  lat: number;
  lng: number;
  elevationM: number | null;
  dataset: string;
  source: string;
}

/**
 * Data-layer access to the `elevationCache` collection. The cache wrapper (T1.5)
 * depends on this interface, not Prisma directly, so it can be unit-tested with
 * an in-memory fake and no network/DB.
 */
export interface ElevationCacheRepo {
  /** Fetch existing rows for the given keys, indexed by key (misses omitted). */
  findByKeys(keys: string[]): Promise<Map<string, ElevationCacheRow>>;
  /** Write-through: insert or refresh each row, setting `fetchedAt = now`. */
  upsertMany(rows: ElevationCacheRow[]): Promise<void>;
}

/**
 * Prisma-backed {@link ElevationCacheRepo}. Instantiated at the composition root
 * (a procedure) with the request's Prisma client; defaults to the shared
 * singleton.
 */
export function createPrismaElevationCacheRepo(db: PrismaClient = prisma): ElevationCacheRepo {
  return {
    async findByKeys(keys) {
      if (keys.length === 0) return new Map();
      const rows = await db.elevationCache.findMany({ where: { key: { in: keys } } });
      return new Map(
        rows.map((r) => [
          r.key,
          {
            key: r.key,
            lat: r.lat,
            lng: r.lng,
            elevationM: r.elevationM,
            dataset: r.dataset,
            source: r.source,
          },
        ]),
      );
    },

    async upsertMany(rows) {
      // MongoDB has no native upsertMany in Prisma; run per-key upserts. `update`
      // refreshes `fetchedAt` so the TTL clock resets on re-write, not only insert.
      await Promise.all(
        rows.map((r) =>
          db.elevationCache.upsert({
            where: { key: r.key },
            create: {
              key: r.key,
              lat: r.lat,
              lng: r.lng,
              elevationM: r.elevationM,
              dataset: r.dataset,
              source: r.source,
              fetchedAt: new Date(),
            },
            update: {
              lat: r.lat,
              lng: r.lng,
              elevationM: r.elevationM,
              dataset: r.dataset,
              source: r.source,
              fetchedAt: new Date(),
            },
          }),
        ),
      );
    },
  };
}
