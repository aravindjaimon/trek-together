import { z } from "zod";
import {
  type LatLng,
  RouteNotFoundError,
  type RoutingProvider,
  RoutingProviderError,
} from "./types";

const PROVIDER = "mapbox";
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Shape of a Mapbox Directions response (v5, `geometries=geojson`). `code` is
 * `"Ok"` on success; `"NoRoute"` / `"NoSegment"` when no route exists. We only
 * need the first route's LineString geometry.
 * https://docs.mapbox.com/api/navigation/directions/
 */
const responseSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        geometry: z.object({
          coordinates: z.array(z.tuple([z.number(), z.number()])),
        }),
      }),
    )
    .default([]),
});

export interface MapboxRoutingConfig {
  baseUrl?: string;
  accessToken?: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

interface ResolvedConfig {
  baseUrl: string;
  accessToken: string;
  fetch: typeof fetch;
  timeoutMs: number;
}

// Cached so env is imported (and validated) at most once, and only when a
// caller relies on env-derived defaults — keeping unit tests that inject
// `baseUrl`/`accessToken` free of any env setup. Mirrors the elevation clients.
let serverEnvPromise: Promise<typeof import("@trek-together/env/server")> | undefined;
function loadServerEnv() {
  serverEnvPromise ??= import("@trek-together/env/server");
  return serverEnvPromise;
}

/**
 * Mapbox Directions (walking profile) routing client. Snaps ordered
 * waypoints onto real footpaths and returns the full-resolution geometry. The
 * access token is a secret with no default: when it is missing the client
 * throws a {@link RoutingProviderError} so the procedure can fail safe to a
 * straight line rather than silently degrade.
 */
export function createMapboxRoutingProvider(config: MapboxRoutingConfig = {}): RoutingProvider {
  let resolved: ResolvedConfig | undefined;

  async function resolveConfig(): Promise<ResolvedConfig> {
    if (resolved) return resolved;
    const env = config.baseUrl && config.accessToken ? undefined : (await loadServerEnv()).env;
    const accessToken = config.accessToken ?? env?.MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      throw new RoutingProviderError("Routing is not configured (missing Mapbox access token)", {
        provider: PROVIDER,
      });
    }
    resolved = {
      baseUrl: config.baseUrl ?? env?.MAPBOX_DIRECTIONS_URL ?? "",
      accessToken,
      fetch: config.fetch ?? globalThis.fetch,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
    return resolved;
  }

  async function snap(waypoints: LatLng[]): Promise<LatLng[]> {
    if (waypoints.length < 2) return waypoints;

    const { baseUrl, accessToken, fetch: doFetch, timeoutMs } = await resolveConfig();

    // Mapbox path is `;`-separated `lng,lat` pairs.
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const params = new URLSearchParams({
      geometries: "geojson",
      overview: "full",
      access_token: accessToken,
    });
    const url = `${baseUrl}/${coords}?${params.toString()}`;

    let response: Response;
    try {
      response = await doFetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (cause) {
      throw new RoutingProviderError("Routing request failed", { provider: PROVIDER, cause });
    }

    if (!response.ok) {
      throw new RoutingProviderError(`Routing request returned HTTP ${response.status}`, {
        provider: PROVIDER,
        status: response.status,
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new RoutingProviderError("Routing response was not valid JSON", {
        provider: PROVIDER,
        status: response.status,
        cause,
      });
    }

    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      throw new RoutingProviderError("Routing response had an unexpected shape", {
        provider: PROVIDER,
        status: response.status,
        cause: parsed.error,
      });
    }

    const route = parsed.data.routes[0];
    if (parsed.data.code !== "Ok" || !route) {
      throw new RouteNotFoundError(PROVIDER);
    }

    return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  }

  return { snap };
}
