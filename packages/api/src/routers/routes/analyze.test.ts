import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { Context } from "../../context";
import type { AppRouterClient } from "../index";
import { appRouter } from "../index";

// Keep the test offline: the elevation client is mocked, so no Mongo and no
// provider network is touched. Flat 100 m by default (no ascent → "Easiest");
// individual tests override `elevation.of` (reset in afterEach).
const elevation = vi.hoisted(() => ({
  of: (_p: { lat: number; lng: number }): number | null => 100,
}));
vi.mock("../../integrations/elevation/default-service", () => ({
  createDefaultElevationService: () => ({
    getElevations: async (points: Array<{ lat: number; lng: number }>) => ({
      points: points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        elevationM: elevation.of(p),
        dataset: "test",
      })),
      stats: { hits: 0, misses: points.length },
    }),
  }),
}));

afterEach(() => {
  elevation.of = () => 100;
});

let server: Server;
let client: AppRouterClient;

beforeAll(async () => {
  const handler = new RPCHandler(appRouter);
  // Anonymous request: session is null — proves auth is optional (T3.3).
  const context = { db: undefined, session: null, requestId: "test" } as unknown as Context;

  server = createServer(async (req, res) => {
    const { matched } = await handler.handle(req, res, { prefix: "/rpc", context });
    if (!matched) {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const { port } = server.address() as AddressInfo;
  const link = new RPCLink({ url: `http://localhost:${port}/rpc` });
  client = createORPCClient(link);
});

afterAll(() => {
  server.close();
});

const validPath = [
  { lat: 0, lng: 0 },
  { lat: 0.01, lng: 0 },
];

describe("routes.analyze (over HTTP)", () => {
  it("returns a full analysis for a valid polyline (anonymous)", async () => {
    const result = await client.routes.analyze({ path: validPath, spacingM: 100 });

    expect(result.distanceM).toBeGreaterThan(1000);
    expect(result.ascentM).toBe(0);
    expect(result.descentM).toBe(0);
    expect(result.difficultyBand).toBe("Easiest");
    expect(result.elevationProfile.length).toBeGreaterThan(1);
    expect(result.elevationProfile[0]).toEqual({ distanceAlongM: 0, elevationM: 100 });
    expect(result.meta).toBeDefined();
  });

  it("rejects an invalid polyline with a typed validation error", async () => {
    // Single point violates the min(2) input contract.
    const err = await client.routes.analyze({ path: [{ lat: 0, lng: 0 }] }).catch((e) => e);

    expect(err).toBeInstanceOf(ORPCError);
    expect((err as ORPCError<string, unknown>).code).toBe("BAD_REQUEST");
  });

  it("accepts full-resolution snapped geometry (3000 vertices)", async () => {
    // routes.snap returns a vertex per path node, so the schema cap is 3000.
    // ~1.1 m apart → ~3.3 km total, well under the guardSize points budget.
    const dense = Array.from({ length: 3000 }, (_, i) => ({ lat: i * 1e-5, lng: 0 }));

    const result = await client.routes.analyze({ path: dense, spacingM: 100 });

    expect(result.distanceM).toBeGreaterThan(3000);
    expect(result.difficultyBand).toBe("Easiest");
  });

  it("maps a route outside data coverage to typed VALIDATION — never a 500 (T10.7)", async () => {
    elevation.of = () => null; // every sample outside the dataset (route over water)

    const err = await client.routes.analyze({ path: validPath, spacingM: 100 }).catch((e) => e);

    expect((err as ORPCError<string, unknown>).code).toBe("VALIDATION");
  });

  it("still rejects routes that would densify past the sample budget (guardSize)", async () => {
    // Two vertices ~1100 km apart densify to far more than MAX_PROFILE_POINTS,
    // so the vertex-count cap alone can't be gamed by long sparse routes.
    const err = await client.routes
      .analyze({
        path: [
          { lat: 0, lng: 0 },
          { lat: 10, lng: 0 },
        ],
      })
      .catch((e) => e);

    expect((err as ORPCError<string, unknown>).code).toBe("VALIDATION");
  });
});
