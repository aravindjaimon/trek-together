import { describe, expect, it, vi } from "vitest";
import { createOpenElevationProvider } from "./open-elevation";
import { ElevationProviderError, type LatLng } from "./types";

const BASE_URL = "https://example.test/api/v1";

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

function makeProvider(fetchImpl: typeof fetch) {
  return createOpenElevationProvider({ baseUrl: BASE_URL, fetch: fetchImpl });
}

describe("createOpenElevationProvider.lookup", () => {
  it("maps results to elevation points in input order with open-elevation provenance", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        results: [
          { latitude: 27.9881, longitude: 86.925, elevation: 8729 },
          { latitude: 0, longitude: 0, elevation: 0 },
        ],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const result = await provider.lookup([everest, sea]);

    expect(result).toEqual([
      { lat: 27.9881, lng: 86.925, elevationM: 8729, dataset: "open-elevation" },
      { lat: 0, lng: 0, elevationM: 0, dataset: "open-elevation" },
    ]);
  });

  it("POSTs an array of {latitude, longitude} objects to {baseUrl}/lookup", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        results: [
          { latitude: 27.9881, longitude: 86.925, elevation: 8729 },
          { latitude: 0, longitude: 0, elevation: 0 },
        ],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await provider.lookup([everest, sea]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.test/api/v1/lookup");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      locations: [
        { latitude: 27.9881, longitude: 86.925 },
        { latitude: 0, longitude: 0 },
      ],
    });
  });

  it("returns an empty array without calling fetch when given no points", async () => {
    const fetchMock = vi.fn();
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const result = await provider.lookup([]);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it("raises a typed error (carrying the status) on a non-2xx response", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "boom" }, { ok: false, status: 500 }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const error = await provider.lookup([sea]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ElevationProviderError);
    expect((error as ElevationProviderError).status).toBe(500);
  });

  it("raises a typed error when the response shape is malformed", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.lookup([sea])).rejects.toBeInstanceOf(ElevationProviderError);
  });

  it("raises a typed error when result count does not match input", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }));
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
});
