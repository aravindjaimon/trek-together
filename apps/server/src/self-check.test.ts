import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { findShadowedAddresses, INSTANCE_HEADER, SELF_CHECK_HEADER } from "./self-check";

function respondWithId(id: string) {
  return createServer((req, res) => {
    void req;
    res.setHeader(INSTANCE_HEADER, id);
    res.end("OK");
  });
}

function listen(server: Server, host?: string, port = 0): Promise<number> {
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("expected AddressInfo"));
        return;
      }
      resolve(address.port);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe("findShadowedAddresses", () => {
  const servers: Server[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map(close));
  });

  it("reports a loopback address answering with a different instance id", async () => {
    const ourId = randomUUID();
    const wildcard = respondWithId(ourId);
    servers.push(wildcard);
    const port = await listen(wildcard);

    let squatter: Server | null = null;
    try {
      squatter = respondWithId(randomUUID());
      await listen(squatter, "::1", port);
      servers.push(squatter);
    } catch {
      // No IPv6 loopback available in this environment — nothing to assert.
      return;
    }

    expect(await findShadowedAddresses(port, ourId)).toEqual(["[::1]"]);
  });

  it("returns nothing when only our own server answers", async () => {
    const ourId = randomUUID();
    const wildcard = respondWithId(ourId);
    servers.push(wildcard);
    const port = await listen(wildcard);

    expect(await findShadowedAddresses(port, ourId)).toEqual([]);
  });

  it("sends the self-check header so probes can be told apart from real traffic", async () => {
    const ourId = randomUUID();
    let seenHeader: string | null = null;
    const wildcard = createServer((req, res) => {
      seenHeader = (req.headers[SELF_CHECK_HEADER] as string | undefined) ?? null;
      res.setHeader(INSTANCE_HEADER, ourId);
      res.end("OK");
    });
    servers.push(wildcard);
    const port = await listen(wildcard);

    await findShadowedAddresses(port, ourId);
    expect(seenHeader).toBe(ourId);
  });
});
