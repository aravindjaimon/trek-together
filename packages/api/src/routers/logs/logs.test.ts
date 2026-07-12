import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createORPCClient, type ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Context } from "../../context";
import type { AppRouterClient } from "../index";
import { appRouter } from "../index";

// Importing appRouter pulls in the elevation + routing default-services, which
// read env at import time — mock them out so the suite needs no env or network.
vi.mock("../../integrations/elevation/default-service", () => ({
  createDefaultElevationService: () => ({
    getElevations: async () => ({ points: [], stats: { hits: 0, misses: 0 } }),
  }),
}));
vi.mock("../../integrations/routing/default-service", () => ({
  createDefaultRoutingService: () => ({ snap: async () => [] }),
}));

// In-memory routes store — logs authz calls findVisibility (the projected gate),
// and create needs findById; only the fields the read gate reads matter.
const routes = vi.hoisted(() => {
  // biome-ignore lint/suspicious/noExplicitAny: in-memory stand-in
  const store = new Map<string, any>();
  let seq = 0;
  return {
    store,
    nextId: () => (++seq).toString(16).padStart(24, "0"),
    reset: () => store.clear(),
  };
});

vi.mock("../../data/routes.repo", () => ({
  createPrismaRoutesRepo: () => ({
    // biome-ignore lint/suspicious/noExplicitAny: test double
    async create(input: any) {
      const id = routes.nextId();
      const rec = { ...input, id };
      routes.store.set(id, rec);
      return rec;
    },
    async findById(id: string) {
      return routes.store.get(id) ?? null;
    },
    async findVisibility(id: string) {
      const r = routes.store.get(id);
      return r ? { ownerId: r.ownerId, isPublic: r.isPublic } : null;
    },
  }),
}));

// In-memory logs store with the real stats math, so the authz matrix + the
// stats contract are both exercised without Mongo.
const logs = vi.hoisted(() => {
  // biome-ignore lint/suspicious/noExplicitAny: in-memory stand-in
  const store: any[] = [];
  let seq = 0;
  return {
    store,
    nextId: () => (++seq).toString(16).padStart(24, "0"),
    reset: () => {
      store.length = 0;
    },
  };
});

vi.mock("../../data/logs.repo", () => ({
  createPrismaLogsRepo: () => ({
    // biome-ignore lint/suspicious/noExplicitAny: test double
    async create(input: any) {
      const rec = {
        ...input,
        id: logs.nextId(),
        createdAt: new Date(Date.now() + logs.store.length),
      };
      logs.store.push(rec);
      return rec;
    },
    async statsForRoute(routeId: string) {
      const forRoute = logs.store.filter((l) => l.routeId === routeId);
      const count = forRoute.length;
      if (count === 0) return { count: 0, avgRating: null, avgActualDurationS: null };
      const avg = (f: (x: (typeof forRoute)[number]) => number) =>
        forRoute.reduce((s, l) => s + f(l), 0) / count;
      return {
        count,
        avgRating: avg((l) => l.rating),
        avgActualDurationS: avg((l) => l.actualDurationS),
      };
    },
    async listForRoute({ routeId, page, limit }: { routeId: string; page: number; limit: number }) {
      const all = logs.store
        .filter((l) => l.routeId === routeId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const take = Math.min(limit, 50);
      const skip = (page - 1) * take;
      const forRoute = logs.store.filter((l) => l.routeId === routeId);
      const count = forRoute.length;
      const stats =
        count === 0
          ? { count: 0, avgRating: null, avgActualDurationS: null }
          : {
              count,
              avgRating: forRoute.reduce((s, l) => s + l.rating, 0) / count,
              avgActualDurationS: forRoute.reduce((s, l) => s + l.actualDurationS, 0) / count,
            };
      return { items: all.slice(skip, skip + take), total: all.length, stats };
    },
  }),
}));

let server: Server;
let anon: AppRouterClient;
let alice: AppRouterClient;
let bob: AppRouterClient;

function clientFor(port: number, user?: string): AppRouterClient {
  const link = new RPCLink({
    url: `http://localhost:${port}/rpc`,
    headers: user ? { "x-test-user": user } : {},
  });
  return createORPCClient(link);
}

beforeAll(async () => {
  const handler = new RPCHandler(appRouter);
  server = createServer(async (req, res) => {
    const userId = req.headers["x-test-user"];
    // Session carries a display name — logs.create reads user.name.
    const session =
      typeof userId === "string" ? { user: { id: userId, name: `${userId} Hiker` } } : null;
    const context = { db: undefined, session, requestId: "test" } as unknown as Context;
    const { matched } = await handler.handle(req, res, { prefix: "/rpc", context });
    if (!matched) {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  anon = clientFor(port);
  alice = clientFor(port, "alice");
  bob = clientFor(port, "bob");
});

afterAll(() => server.close());
beforeEach(() => {
  routes.reset();
  logs.reset();
});

function code(err: unknown): string {
  return (err as ORPCError<string, unknown>).code;
}

/** Seed a route directly in the in-memory store; returns its id. */
function seedRoute(ownerId: string, isPublic: boolean): string {
  const id = routes.nextId();
  routes.store.set(id, { id, ownerId, isPublic });
  return id;
}

const validLog = {
  completedOn: "2026-07-01",
  actualDurationS: 14400,
  rating: 4,
  notes: "Great ridge walk",
};

describe("logs.create + authz", () => {
  it("requires authentication", async () => {
    const routeId = seedRoute("alice", true);
    const err = await anon.logs.create({ routeId, ...validLog }).catch((e) => e);
    expect(code(err)).toBe("UNAUTHORIZED");
  });

  it("records a log on a visible route, returning the display name (no userId)", async () => {
    const routeId = seedRoute("alice", true);
    const log = await bob.logs.create({ routeId, ...validLog });
    expect(log.userName).toBe("bob Hiker");
    expect(log).not.toHaveProperty("userId");
    expect(log.rating).toBe(4);
    expect(log.notes).toBe("Great ridge walk");
  });

  it("hides a private route from a non-owner (uniform NOT_FOUND)", async () => {
    const routeId = seedRoute("alice", false);
    expect(code(await bob.logs.create({ routeId, ...validLog }).catch((e) => e))).toBe("NOT_FOUND");
    // The owner can log on their own private route.
    expect((await alice.logs.create({ routeId, ...validLog })).userName).toBe("alice Hiker");
  });

  it("rejects a future completedOn and an out-of-range rating", async () => {
    const routeId = seedRoute("alice", true);
    expect(
      code(
        await alice.logs
          .create({ routeId, ...validLog, completedOn: "2999-01-01" })
          .catch((e) => e),
      ),
    ).toBe("BAD_REQUEST");
    expect(code(await alice.logs.create({ routeId, ...validLog, rating: 6 }).catch((e) => e))).toBe(
      "BAD_REQUEST",
    );
  });
});

describe("logs.listForRoute", () => {
  it("reads a public route's logs + stats anonymously, newest-first", async () => {
    const routeId = seedRoute("alice", true);
    await alice.logs.create({ routeId, ...validLog, rating: 4, actualDurationS: 14400 });
    await bob.logs.create({ routeId, ...validLog, rating: 2, actualDurationS: 18000, notes: null });

    const res = await anon.logs.listForRoute({ routeId });
    expect(res.total).toBe(2);
    expect(res.stats).toEqual({ count: 2, avgRating: 3, avgActualDurationS: 16200 });
    expect(res.items.map((l) => l.rating)).toEqual([2, 4]); // newest-first
  });

  it("returns empty stats for a route with no logs", async () => {
    const routeId = seedRoute("alice", true);
    const res = await anon.logs.listForRoute({ routeId });
    expect(res).toMatchObject({
      total: 0,
      stats: { count: 0, avgRating: null, avgActualDurationS: null },
    });
  });

  it("hides a private route's logs from anon and non-owners", async () => {
    const routeId = seedRoute("alice", false);
    await alice.logs.create({ routeId, ...validLog });

    expect(code(await anon.logs.listForRoute({ routeId }).catch((e) => e))).toBe("NOT_FOUND");
    expect(code(await bob.logs.listForRoute({ routeId }).catch((e) => e))).toBe("NOT_FOUND");
    expect((await alice.logs.listForRoute({ routeId })).total).toBe(1);
  });

  it("caps the page size at 50", async () => {
    const routeId = seedRoute("alice", true);
    const err = await anon.logs.listForRoute({ routeId, limit: 200 }).catch((e) => e);
    expect(code(err)).toBe("BAD_REQUEST");
  });

  it("rejects a malformed routeId at the boundary", async () => {
    expect(code(await anon.logs.listForRoute({ routeId: "nope" }).catch((e) => e))).toBe(
      "BAD_REQUEST",
    );
  });
});
