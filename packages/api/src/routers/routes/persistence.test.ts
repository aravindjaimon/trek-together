import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Context } from "../../context";
import type { AppRouterClient } from "../index";
import { appRouter } from "../index";

// Flat, offline elevation so create()'s analysis is deterministic (no network/Mongo).
vi.mock("../../integrations/elevation/default-service", () => ({
  createDefaultElevationService: () => ({
    getElevations: async (points: Array<{ lat: number; lng: number }>) => ({
      points: points.map((p) => ({ lat: p.lat, lng: p.lng, elevationM: 100, dataset: "test" })),
      stats: { hits: 0, misses: points.length },
    }),
  }),
}));

// In-memory RoutesRepo so the whole create->get->list->update->remove flow runs
// without a database. Hoisted store is shared with the mock factory + reset.
const repo = vi.hoisted(() => {
  // biome-ignore lint/suspicious/noExplicitAny: in-memory stand-in for RouteRecord
  const store = new Map<string, any>();
  let seq = 0;
  return {
    store,
    // 24-hex, ObjectId-shaped, so it passes the boundary id validation.
    nextId: () => (++seq).toString(16).padStart(24, "0"),
    reset: () => store.clear(),
  };
});

vi.mock("../../data/routes.repo", () => ({
  createPrismaRoutesRepo: () => ({
    // biome-ignore lint/suspicious/noExplicitAny: test double
    async create(input: any) {
      const id = repo.nextId();
      const now = new Date();
      const rec = { ...input, id, createdAt: now, updatedAt: now };
      repo.store.set(id, rec);
      return rec;
    },
    async findById(id: string) {
      return repo.store.get(id) ?? null;
    },
    async listByOwner({ ownerId, page, limit }: { ownerId: string; page: number; limit: number }) {
      const all = [...repo.store.values()]
        .filter((r) => r.ownerId === ownerId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      const take = Math.min(limit, 100);
      const skip = (page - 1) * take;
      return { items: all.slice(skip, skip + take), total: all.length };
    },
    // biome-ignore lint/suspicious/noExplicitAny: test double
    async update(id: string, patch: any) {
      const next = { ...repo.store.get(id), ...patch, updatedAt: new Date() };
      repo.store.set(id, next);
      return next;
    },
    async delete(id: string) {
      repo.store.delete(id);
    },
  }),
}));

let server: Server;
// Per-identity clients: the test server derives the session from an x-test-user header.
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
    const session = typeof userId === "string" ? { user: { id: userId } } : null;
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
beforeEach(() => repo.reset());

const path = [
  { lat: 38.5, lng: -78.3 },
  { lat: 38.55, lng: -78.31 },
];

function code(err: unknown): string {
  return (err as ORPCError<string, unknown>).code;
}

describe("routes persistence + authz", () => {
  it("create requires auth", async () => {
    const err = await anon.routes.create({ path, name: "Old Rag" }).catch((e) => e);
    expect(err).toBeInstanceOf(ORPCError);
    expect(code(err)).toBe("UNAUTHORIZED");
  });

  it("create persists under the session owner and analyses the route", async () => {
    const r = await alice.routes.create({ path, name: "Old Rag", spacingM: 100 });
    expect(r.id).toBeTruthy();
    expect(r.ownerId).toBe("alice");
    expect(r.name).toBe("Old Rag");
    expect(r.isPublic).toBe(false);
    expect(r.distanceM).toBeGreaterThan(0);
    expect(r.path.type).toBe("LineString");
    // [lng,lat] order preserved in storage.
    expect(r.path.coordinates[0]).toEqual([-78.3, 38.5]);
  });

  it("getById hides a private route from anon and non-owners, shows it to the owner", async () => {
    const r = await alice.routes.create({ path, name: "Secret", spacingM: 100 });

    expect(code(await anon.routes.getById({ id: r.id }).catch((e) => e))).toBe("NOT_FOUND");
    expect(code(await bob.routes.getById({ id: r.id }).catch((e) => e))).toBe("NOT_FOUND");
    expect((await alice.routes.getById({ id: r.id })).id).toBe(r.id);
  });

  it("getById serves a public route to anyone (share-by-link)", async () => {
    const r = await alice.routes.create({ path, name: "Public", spacingM: 100, isPublic: true });
    expect((await anon.routes.getById({ id: r.id })).id).toBe(r.id);
    expect((await bob.routes.getById({ id: r.id })).id).toBe(r.id);
  });

  it("listMine returns only the caller's routes, newest first", async () => {
    await alice.routes.create({ path, name: "A", spacingM: 100 });
    await alice.routes.create({ path, name: "B", spacingM: 100 });
    await bob.routes.create({ path, name: "C", spacingM: 100 });

    const mine = await alice.routes.listMine({ page: 1, limit: 20 });
    expect(mine.total).toBe(2);
    expect(mine.items.map((r) => r.name)).toEqual(["B", "A"]);

    const bobs = await bob.routes.listMine({});
    expect(bobs.total).toBe(1);
  });

  it("update is owner-only and patches metadata", async () => {
    const r = await alice.routes.create({ path, name: "Draft", spacingM: 100 });

    expect(code(await bob.routes.update({ id: r.id, isPublic: true }).catch((e) => e))).toBe(
      "NOT_FOUND",
    );

    const updated = await alice.routes.update({ id: r.id, name: "Final", isPublic: true });
    expect(updated.name).toBe("Final");
    expect(updated.isPublic).toBe(true);
  });

  it("remove is owner-only and deletes", async () => {
    const r = await alice.routes.create({ path, name: "Temp", spacingM: 100 });

    expect(code(await bob.routes.remove({ id: r.id }).catch((e) => e))).toBe("NOT_FOUND");

    expect(await alice.routes.remove({ id: r.id })).toEqual({ id: r.id });
    expect(code(await alice.routes.getById({ id: r.id }).catch((e) => e))).toBe("NOT_FOUND");
  });

  it("rejects a malformed id at the boundary", async () => {
    const err = await anon.routes.getById({ id: "not-an-objectid" }).catch((e) => e);
    expect(code(err)).toBe("BAD_REQUEST");
  });
});
