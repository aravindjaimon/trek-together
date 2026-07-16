import { z } from "zod";

import { createRateLimiter } from "../elevation/rate-limit";
import {
  type GeocodingProvider,
  GeocodingProviderError,
  type GeoPlace,
  type LatLng,
} from "./types";

const PROVIDER = "nominatim";
const DEFAULT_TIMEOUT_MS = 10_000;
// Nominatim's usage policy requires an identifying User-Agent and ≤1 req/s.
const USER_AGENT = "trek-together/0.1 (geocoding client)";

// Module-scoped so the ≤1 req/s guard spans every provider instance and every
// concurrent request — a per-instance limiter would be useless since
// `createDefaultGeocodingService()` builds a fresh provider per call.
const schedule = createRateLimiter(1_000);

/**
 * Shape of a Nominatim `/search?format=json` row. `lat`/`lon` and the
 * `boundingbox` entries are strings; `boundingbox` is `[minLat, maxLat, minLon,
 * maxLon]`. We only need those four fields.
 * https://nominatim.org/release-docs/latest/api/Search/
 */
const responseSchema = z.array(
  z.object({
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
    boundingbox: z.tuple([z.string(), z.string(), z.string(), z.string()]).optional(),
  }),
);

export interface NominatimConfig {
  baseUrl?: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

interface ResolvedConfig {
  baseUrl: string;
  fetch: typeof fetch;
  timeoutMs: number;
}

// Cached so env is imported (and validated) at most once, and only when a
// caller relies on env-derived defaults — keeping unit tests that inject
// `baseUrl` free of any env setup. Mirrors the routing/elevation clients.
let serverEnvPromise: Promise<typeof import("@trek-together/env/server")> | undefined;
function loadServerEnv() {
  serverEnvPromise ??= import("@trek-together/env/server");
  return serverEnvPromise;
}

/**
 * Nominatim (OpenStreetMap) geocoding client (forward search only). Turns a
 * free-text place query into ranked {@link GeoPlace} matches. Rate-limited to
 * ≤1 req/s at module scope per Nominatim's usage policy; any transport/shape
 * failure is wrapped in {@link GeocodingProviderError} so the procedure fails safe.
 */
export function createNominatimProvider(config: NominatimConfig = {}): GeocodingProvider {
  let resolved: ResolvedConfig | undefined;

  async function resolveConfig(): Promise<ResolvedConfig> {
    if (resolved) return resolved;
    resolved = {
      baseUrl: config.baseUrl ?? (await loadServerEnv()).env.NOMINATIM_BASE_URL,
      fetch: config.fetch ?? globalThis.fetch,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
    return resolved;
  }

  async function search(query: string, limit: number): Promise<GeoPlace[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const { baseUrl, fetch: doFetch, timeoutMs } = await resolveConfig();

    const params = new URLSearchParams({
      q: trimmed,
      format: "json",
      limit: String(limit),
      addressdetails: "0",
    });
    const url = `${baseUrl}/search?${params.toString()}`;

    let response: Response;
    try {
      response = await schedule(() =>
        doFetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(timeoutMs),
        }),
      );
    } catch (cause) {
      throw new GeocodingProviderError("Geocoding request failed", { provider: PROVIDER, cause });
    }

    if (!response.ok) {
      throw new GeocodingProviderError(`Geocoding request returned HTTP ${response.status}`, {
        provider: PROVIDER,
        status: response.status,
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new GeocodingProviderError("Geocoding response was not valid JSON", {
        provider: PROVIDER,
        status: response.status,
        cause,
      });
    }

    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      throw new GeocodingProviderError("Geocoding response had an unexpected shape", {
        provider: PROVIDER,
        status: response.status,
        cause: parsed.error,
      });
    }

    return parsed.data.map((row) => {
      let boundingBox: [LatLng, LatLng] | null = null;
      if (row.boundingbox) {
        // boundingbox is [minLat, maxLat, minLon, maxLon] as strings.
        const [minLat, maxLat, minLon, maxLon] = row.boundingbox.map(Number);
        if ([minLat, maxLat, minLon, maxLon].every(Number.isFinite)) {
          boundingBox = [
            { lat: minLat as number, lng: minLon as number },
            { lat: maxLat as number, lng: maxLon as number },
          ];
        }
      }
      return {
        label: row.display_name,
        lat: Number.parseFloat(row.lat),
        lng: Number.parseFloat(row.lon),
        boundingBox,
      };
    });
  }

  return { search };
}
