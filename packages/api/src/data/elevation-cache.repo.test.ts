import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db package so importing the repo never constructs a real PrismaClient
// (which would need DATABASE_URL). The repo takes an injected client anyway.
vi.mock("@trek-together/db", () => ({ default: {}, PrismaClient: class {} }));

import { createPrismaElevationCacheRepo } from "./elevation-cache.repo";

type MockDb = {
  elevationCache: { findMany: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
};

let db: MockDb;

beforeEach(() => {
  db = {
    elevationCache: {
      findMany: vi.fn(),
      upsert: vi.fn(async () => ({})),
    },
  };
});

describe("createPrismaElevationCacheRepo", () => {
  it("findByKeys queries by key `in` and returns rows indexed by key", async () => {
    db.elevationCache.findMany.mockResolvedValue([
      {
        key: "srtm30m:1,2",
        lat: 1,
        lng: 2,
        elevationM: 10,
        dataset: "srtm30m",
        source: "opentopodata",
      },
    ]);
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaElevationCacheRepo(db as any);

    const found = await repo.findByKeys(["srtm30m:1,2", "srtm30m:9,9"]);

    expect(db.elevationCache.findMany).toHaveBeenCalledWith({
      where: { key: { in: ["srtm30m:1,2", "srtm30m:9,9"] } },
    });
    expect(found.get("srtm30m:1,2")?.elevationM).toBe(10);
    expect(found.has("srtm30m:9,9")).toBe(false);
  });

  it("findByKeys short-circuits without querying for empty input", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaElevationCacheRepo(db as any);

    const found = await repo.findByKeys([]);

    expect(found.size).toBe(0);
    expect(db.elevationCache.findMany).not.toHaveBeenCalled();
  });

  it("upsertMany issues a keyed upsert per row that refreshes fetchedAt on update", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaElevationCacheRepo(db as any);

    await repo.upsertMany([
      {
        key: "srtm30m:1,2",
        lat: 1,
        lng: 2,
        elevationM: null,
        dataset: "srtm30m",
        source: "opentopodata",
      },
    ]);

    expect(db.elevationCache.upsert).toHaveBeenCalledTimes(1);
    const arg = db.elevationCache.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ key: "srtm30m:1,2" });
    expect(arg.create.fetchedAt).toBeInstanceOf(Date);
    expect(arg.update.fetchedAt).toBeInstanceOf(Date);
    expect(arg.create.elevationM).toBeNull(); // out-of-bounds preserved
  });
});
