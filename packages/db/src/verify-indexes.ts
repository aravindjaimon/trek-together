import type { PrismaClient } from "../prisma/generated/client";

/**
 * Index names created by `setup-indexes.ts` — keep the two lists in sync.
 * These are the indexes Prisma can't express, which a raw `prisma db push`
 * (anything but the `pnpm db:push` script) silently drops: the elevation
 * cache stops expiring and explore's `$geoNear` starts failing.
 */
const REQUIRED_INDEXES = [
  { collection: "elevationCache", index: "fetchedAt_ttl" },
  { collection: "routes", index: "path_2dsphere" },
] as const;

export interface MissingIndex {
  collection: string;
  index: string;
}

/**
 * Report which out-of-band indexes are missing (T10.9). Callers warn loudly
 * rather than crash — a fresh dev DB legitimately has neither collection yet.
 */
export async function verifyIndexes(prisma: PrismaClient): Promise<MissingIndex[]> {
  const missing: MissingIndex[] = [];
  for (const { collection, index } of REQUIRED_INDEXES) {
    try {
      const result = (await prisma.$runCommandRaw({ listIndexes: collection })) as {
        cursor?: { firstBatch?: Array<{ name?: string }> };
      };
      const names = (result.cursor?.firstBatch ?? []).map((i) => i.name);
      if (!names.includes(index)) missing.push({ collection, index });
    } catch {
      // listIndexes fails when the collection doesn't exist yet (fresh DB).
      missing.push({ collection, index });
    }
  }
  return missing;
}
