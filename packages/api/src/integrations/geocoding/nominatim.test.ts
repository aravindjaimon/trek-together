import { describe, expect, it, vi } from "vitest";

import { createNominatimProvider } from "./nominatim";
import { GeocodingProviderError } from "./types";

// A canned Nominatim `/search?format=json` row. Note lat/lon and every
// boundingbox entry are strings, and boundingbox is [minLat, maxLat, minLon, maxLon].
const shenandoahRow = {
  display_name: "Shenandoah National Park, Virginia, United States",
  lat: "38.4755",
  lon: "-78.4535",
  boundingbox: ["38.4", "38.6", "-78.5", "-78.2"],
};

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

describe("createNominatimProvider", () => {
  it("maps rows to GeoPlace with parsed coords and bbox corners", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([shenandoahRow]));
    const provider = createNominatimProvider({ baseUrl: "https://geo.test", fetch: fetchMock });

    const results = await provider.search("Shenandoah", 5);

    expect(results).toEqual([
      {
        label: "Shenandoah National Park, Virginia, United States",
        lat: 38.4755,
        lng: -78.4535,
        // [minLat,maxLat,minLon,maxLon] -> [{SW}, {NE}]
        boundingBox: [
          { lat: 38.4, lng: -78.5 },
          { lat: 38.6, lng: -78.2 },
        ],
      },
    ]);

    // Query is sent as q= with format=json, and the request is well-formed.
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("https://geo.test/search?");
    expect(url).toContain("q=Shenandoah");
    expect(url).toContain("format=json");
  });

  it("returns boundingBox: null when the provider omits boundingbox", async () => {
    const { boundingbox, ...noBox } = shenandoahRow;
    const fetchMock = vi.fn(async () => jsonResponse([noBox]));
    const provider = createNominatimProvider({ baseUrl: "https://geo.test", fetch: fetchMock });

    const [place] = await provider.search("Shenandoah", 5);

    expect(place?.boundingBox).toBeNull();
  });

  it("short-circuits a blank query without calling fetch", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([]));
    const provider = createNominatimProvider({ baseUrl: "https://geo.test", fetch: fetchMock });

    expect(await provider.search("   ", 5)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws GeocodingProviderError on a non-ok response", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse("Too Many Requests", { ok: false, status: 429 }),
    );
    const provider = createNominatimProvider({ baseUrl: "https://geo.test", fetch: fetchMock });

    await expect(provider.search("Shenandoah", 5)).rejects.toBeInstanceOf(GeocodingProviderError);
  });

  it("throws GeocodingProviderError on an unexpected response shape", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ unexpected: true }));
    const provider = createNominatimProvider({ baseUrl: "https://geo.test", fetch: fetchMock });

    await expect(provider.search("Shenandoah", 5)).rejects.toBeInstanceOf(GeocodingProviderError);
  });
});
