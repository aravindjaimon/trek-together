import { describe, expect, it, vi } from "vitest";
import { getProvider, type ProviderName } from "./index";

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("getProvider", () => {
  it("returns an OpenTopoData provider that shapes its request as {baseUrl}/{dataset}", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: "OK",
        results: [{ elevation: 10, location: { lat: 1, lng: 2 }, dataset: "srtm30m" }],
      }),
    );
    const provider = getProvider("opentopodata", {
      opentopodata: {
        baseUrl: "https://otd.test/v1",
        dataset: "srtm30m",
        fetch: fetchMock as unknown as typeof fetch,
        dailyLimit: 1000, // injected so the test never loads env
      },
    });

    const [point] = await provider.lookup([{ lat: 1, lng: 2 }]);

    expect(point).toEqual({ lat: 1, lng: 2, elevationM: 10, dataset: "srtm30m" });
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe("https://otd.test/v1/srtm30m");
  });

  it("returns an Open-Elevation provider that posts to {baseUrl}/lookup", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ results: [{ latitude: 1, longitude: 2, elevation: 10 }] }),
    );
    const provider = getProvider("open-elevation", {
      "open-elevation": {
        baseUrl: "https://oe.test/api/v1",
        fetch: fetchMock as unknown as typeof fetch,
      },
    });

    const [point] = await provider.lookup([{ lat: 1, lng: 2 }]);

    expect(point).toEqual({ lat: 1, lng: 2, elevationM: 10, dataset: "open-elevation" });
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe("https://oe.test/api/v1/lookup");
  });

  it("throws clearly on an unknown provider name", () => {
    expect(() => getProvider("mystery" as ProviderName)).toThrow(/Unknown elevation provider/);
  });
});
