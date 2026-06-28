import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createORPCClient, type ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCHandler } from "@orpc/server/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Context } from "../../context";
import { RouteNotFoundError, RoutingProviderError } from "../../integrations/routing/types";
import type { AppRouterClient } from "../index";
import { appRouter } from "../index";

// Keep the test offline: the routing provider is mocked per-test — no Mapbox
// network, no token. Mirrors analyze.test.ts's default-service seam.
const snapMock = vi.hoisted(() => vi.fn());
vi.mock("../../integrations/routing/default-service", () => ({
  createDefaultRoutingService: () => ({ snap: snapMock }),
}));

// Importing appRouter pulls in the elevation default-service, which reads env
// at import time — mock it out (same seam analyze.test.ts uses) so no env or
// network is needed.
vi.mock("../../integrations/elevation/default-service", () => ({
  createDefaultElevationService: () => ({
    getElevations: async () => ({ points: [], stats: { hits: 0, misses: 0 } }),
  }),
}));

let server: Server;
let client: AppRouterClient;

beforeAll(async () => {
  const handler = new RPCHandler(appRouter);
  // Anonymous request: session is null — snapping is optional-auth like analyze.
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

beforeEach(() => {
  snapMock.mockReset();
});

function code(err: unknown): string {
  return (err as ORPCError<string, unknown>).code;
}

const waypoints = [
  { lat: 38.55, lng: -78.32 },
  { lat: 38.56, lng: -78.31 },
];

describe("routes.snap (over HTTP)", () => {
  it("returns the snapped geometry for valid waypoints (anonymous)", async () => {
    const snapped = [
      { lat: 38.55, lng: -78.32 },
      { lat: 38.553, lng: -78.318 },
      { lat: 38.556, lng: -78.314 },
      { lat: 38.56, lng: -78.31 },
    ];
    snapMock.mockResolvedValue(snapped);

    const result = await client.routes.snap({ waypoints });

    expect(result.path).toEqual(snapped);
    expect(snapMock).toHaveBeenCalledWith(waypoints);
  });

  it("maps 'no walkable route' to ROUTING_UNAVAILABLE so the client can fall back", async () => {
    snapMock.mockRejectedValue(new RouteNotFoundError("mapbox"));

    const err = await client.routes.snap({ waypoints }).catch((e) => e);

    expect(code(err)).toBe("ROUTING_UNAVAILABLE");
  });

  it("maps provider/config failures (e.g. missing token) to ROUTING_UNAVAILABLE", async () => {
    snapMock.mockRejectedValue(
      new RoutingProviderError("MAPBOX_ACCESS_TOKEN is not configured", { provider: "mapbox" }),
    );

    const err = await client.routes.snap({ waypoints }).catch((e) => e);

    expect(code(err)).toBe("ROUTING_UNAVAILABLE");
  });

  it("never leaks unexpected error detail to the client", async () => {
    snapMock.mockRejectedValue(new Error("secret internal detail"));

    const err = (await client.routes.snap({ waypoints }).catch((e) => e)) as Error;

    expect(err.message).not.toContain("secret internal detail");
  });

  it("rejects fewer than 2 waypoints with a typed validation error", async () => {
    const err = await client.routes
      .snap({ waypoints: [{ lat: 38.55, lng: -78.32 }] })
      .catch((e) => e);

    expect(code(err)).toBe("BAD_REQUEST");
    expect(snapMock).not.toHaveBeenCalled();
  });

  it("rejects more than 25 waypoints with a typed validation error", async () => {
    const tooMany = Array.from({ length: 26 }, (_, i) => ({
      lat: 38.55 + i * 0.001,
      lng: -78.32,
    }));

    const err = await client.routes.snap({ waypoints: tooMany }).catch((e) => e);

    expect(code(err)).toBe("BAD_REQUEST");
    expect(snapMock).not.toHaveBeenCalled();
  });
});
