import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOpenTopoDataProvider } from "./opentopodata";
import { resetDailyBudgets } from "./quota";
import { ElevationProviderError, type LatLng } from "./types";

const BASE_URL = "https://example.test/v1";
const DATASET = "srtm30m";

const everest: LatLng = { lat: 27.9881, lng: 86.925 };
const sea: LatLng = { lat: 0, lng: 0 };

function jsonResponse(
  body: unknown,
  init?: { ok?: boolean; status?: number; headers?: Record<string, string> },
): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    headers: new Headers(init?.headers),
    json: async () => body,
  } as unknown as Response;
}

function makeProvider(fetchImpl: typeof fetch, dailyLimit = 1000) {
  return createOpenTopoDataProvider({
    baseUrl: BASE_URL,
    dataset: DATASET,
    fetch: fetchImpl,
    // Injected so unit tests never load env; the budget itself is per-process.
    dailyLimit,
  });
}

// The daily budget is process-global state keyed by provider name.
beforeEach(() => resetDailyBudgets());

describe("createOpenTopoDataProvider.lookup", () => {
  it("maps results to elevation points in input order", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "OK",
        results: [
          { elevation: 8729, location: { lat: 27.9881, lng: 86.925 }, dataset: "srtm30m" },
          { elevation: 0, location: { lat: 0, lng: 0 }, dataset: "srtm30m" },
        ],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const result = await provider.lookup([everest, sea]);

    expect(result).toEqual([
      { lat: 27.9881, lng: 86.925, elevationM: 8729, dataset: "srtm30m" },
      { lat: 0, lng: 0, elevationM: 0, dataset: "srtm30m" },
    ]);
  });

  it("preserves a null elevation for out-of-bounds points (does not coerce to 0)", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "OK",
        results: [{ elevation: null, location: { lat: 0, lng: 0 }, dataset: "srtm30m" }],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const [point] = await provider.lookup([sea]);

    expect(point.elevationM).toBeNull();
  });

  it("returns an empty array without calling fetch when given no points", async () => {
    const fetchMock = vi.fn();
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const result = await provider.lookup([]);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it("POSTs the pipe-joined locations to {baseUrl}/{dataset} in input order", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "OK",
        results: [
          { elevation: 8729, location: { lat: 27.9881, lng: 86.925 }, dataset: "srtm30m" },
          { elevation: 0, location: { lat: 0, lng: 0 }, dataset: "srtm30m" },
        ],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await provider.lookup([everest, sea]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/v1/srtm30m");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ locations: "27.9881,86.925|0,0" });
  });

  it("raises a typed error (carrying the status) on a non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "SERVER_ERROR", error: "boom" }, { ok: false, status: 500 }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const error = await provider.lookup([sea]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ElevationProviderError);
    expect((error as ElevationProviderError).status).toBe(500);
  });

  it("raises a typed error when the payload status is not OK", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "INVALID_REQUEST",
        results: [{ elevation: 1, location: { lat: 0, lng: 0 }, dataset: "srtm30m" }],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.lookup([sea])).rejects.toBeInstanceOf(ElevationProviderError);
  });

  it("raises a typed error when the response shape is malformed", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.lookup([sea])).rejects.toBeInstanceOf(ElevationProviderError);
  });

  it("raises a typed error when result count does not match input", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "OK", results: [] }));
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.lookup([sea])).rejects.toBeInstanceOf(ElevationProviderError);
  });

  it("wraps a network/transport failure in a typed error (no raw fetch error)", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.lookup([sea])).rejects.toBeInstanceOf(ElevationProviderError);
  });

  it("captures Retry-After (seconds) on an upstream 429", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "429" }, { ok: false, status: 429, headers: { "retry-after": "7" } }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const err = (await provider.lookup([sea]).catch((e) => e)) as ElevationProviderError;

    expect(err).toBeInstanceOf(ElevationProviderError);
    expect(err.status).toBe(429);
    expect(err.retryAfterS).toBe(7);
  });

  it("trips the daily budget: the N+1th request fails typed without touching the network", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "OK",
        results: [{ elevation: 1, location: { lat: 0, lng: 0 }, dataset: "srtm30m" }],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch, 2);

    await provider.lookup([sea]);
    await provider.lookup([sea]);
    const err = (await provider.lookup([sea]).catch((e) => e)) as ElevationProviderError;

    expect(err).toBeInstanceOf(ElevationProviderError);
    expect(err.provider).toBe("opentopodata");
    expect(err.message).toContain("budget");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
