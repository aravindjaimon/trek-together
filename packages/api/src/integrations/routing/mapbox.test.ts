import { describe, expect, it, vi } from "vitest";
import { createMapboxRoutingProvider } from "./mapbox";
import { type LatLng, RouteNotFoundError, RoutingProviderError } from "./types";

const BASE_URL = "https://example.test/directions/v5/mapbox/walking";
const TOKEN = "test-token";

const a: LatLng = { lat: 38.5, lng: -78.4 };
const b: LatLng = { lat: 38.6, lng: -78.3 };

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

function makeProvider(fetchImpl: typeof fetch) {
  return createMapboxRoutingProvider({
    baseUrl: BASE_URL,
    accessToken: TOKEN,
    fetch: fetchImpl,
  });
}

describe("createMapboxRoutingProvider.snap", () => {
  it("returns the snapped LineString as LatLng[] and calls the walking endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        code: "Ok",
        routes: [
          {
            geometry: {
              coordinates: [
                [-78.4, 38.5],
                [-78.35, 38.55],
                [-78.3, 38.6],
              ],
            },
          },
        ],
      }),
    );
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    const result = await provider.snap([a, b]);

    expect(result).toEqual([
      { lat: 38.5, lng: -78.4 },
      { lat: 38.55, lng: -78.35 },
      { lat: 38.6, lng: -78.3 },
    ]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain(`${BASE_URL}/-78.4,38.5;-78.3,38.6`);
    expect(url).toContain("geometries=geojson");
    expect(url).toContain(`access_token=${TOKEN}`);
  });

  it("throws RouteNotFoundError when Mapbox finds no route", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ code: "NoRoute", routes: [] }));
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.snap([a, b])).rejects.toBeInstanceOf(RouteNotFoundError);
  });

  it("throws RoutingProviderError on a non-OK HTTP response", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, { ok: false, status: 422 }));
    const provider = makeProvider(fetchMock as unknown as typeof fetch);

    await expect(provider.snap([a, b])).rejects.toBeInstanceOf(RoutingProviderError);
  });
});
