import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db package so importing the repo never constructs a real PrismaClient
// (which would need DATABASE_URL). The repo takes an injected client anyway.
vi.mock("@trek-together/db", () => ({ default: {}, PrismaClient: class {} }));

import { type CreateRouteInput, createPrismaRoutesRepo } from "./routes.repo";

type MockDb = {
  route: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

let db: MockDb;

// A representative persisted document, as Prisma would return it.
function doc(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    ownerId: "u1",
    name: "Old Rag",
    description: null,
    path: { type: "LineString", coordinates: [[-78.3, 38.5] as [number, number], [-78.31, 38.55]] },
    elevationProfile: [{ distanceAlongM: 0, elevationM: 300 }],
    distanceM: 1000,
    ascentM: 200,
    descentM: 50,
    estTimeNaismithS: 1800,
    estTimeToblerS: 1700,
    difficultyScore: 12,
    difficultyBand: "Moderate",
    isPublic: false,
    createdAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-02T00:00:00Z"),
    ...overrides,
  };
}

const createInput: CreateRouteInput = {
  ownerId: "u1",
  name: "Old Rag",
  description: null,
  path: {
    type: "LineString",
    coordinates: [
      [-78.3, 38.5],
      [-78.31, 38.55],
    ],
  },
  elevationProfile: [{ distanceAlongM: 0, elevationM: 300 }],
  distanceM: 1000,
  ascentM: 200,
  descentM: 50,
  estTimeNaismithS: 1800,
  estTimeToblerS: 1700,
  difficultyScore: 12,
  difficultyBand: "Moderate",
  isPublic: false,
};

beforeEach(() => {
  db = {
    route: {
      create: vi.fn(async () => doc()),
      findUnique: vi.fn(),
      findMany: vi.fn(async () => [doc()]),
      count: vi.fn(async () => 1),
      update: vi.fn(async () => doc({ name: "New" })),
      delete: vi.fn(async () => doc()),
    },
  };
});

describe("createPrismaRoutesRepo", () => {
  it("create persists the analysis and maps the doc back to a RouteRecord", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaRoutesRepo(db as any);

    const rec = await repo.create(createInput);

    // GeoJSON path round-trips through the Json field unchanged.
    expect(rec.path).toEqual(createInput.path);
    expect(rec.id).toBe("r1");
    expect(rec.createdAt).toBeInstanceOf(Date);
    expect(db.route.create).toHaveBeenCalledOnce();
  });

  it("findById returns null when absent", async () => {
    db.route.findUnique.mockResolvedValue(null);
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaRoutesRepo(db as any);

    expect(await repo.findById("missing")).toBeNull();
  });

  it("listByOwner caps the limit and computes skip from page", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaRoutesRepo(db as any);

    const res = await repo.listByOwner({ ownerId: "u1", page: 3, limit: 999 });

    // limit clamped to MAX_LIMIT (100); skip = (page-1)*take = 200.
    expect(db.route.findMany).toHaveBeenCalledWith({
      where: { ownerId: "u1" },
      orderBy: { updatedAt: "desc" },
      skip: 200,
      take: 100,
    });
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
  });

  it("listByOwner floors page/limit to sane minimums", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal Prisma mock for a unit test
    const repo = createPrismaRoutesRepo(db as any);

    await repo.listByOwner({ ownerId: "u1", page: 0, limit: 0 });

    expect(db.route.findMany).toHaveBeenCalledWith({
      where: { ownerId: "u1" },
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 1,
    });
  });
});
