import { z } from "zod";
import {
  type ElevationPoint,
  type ElevationProvider,
  ElevationProviderError,
  type LatLng,
} from "./types";

const PROVIDER = "open-elevation";
/**
 * Open-Elevation's public host serves aggregated SRTM/GMTED with no per-point
 * dataset field, so we record a synthetic provenance string rather than a real
 * dataset name.
 */
const SOURCE = "open-elevation";
const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = "trek-together/0.1 (elevation client)";

/**
 * Shape of an Open-Elevation `/lookup` response
 * (https://open-elevation.com/, Jorl17/open-elevation docs/api.md). Unlike
 * OpenTopoData there is no top-level `status` and no `dataset` per result;
 * out-of-bounds points come back as `0` (not `null`). `.nullable()` is
 * defensive against self-hosted variants.
 */
const responseSchema = z.object({
  results: z.array(
    z.object({
      latitude: z.number(),
      longitude: z.number(),
      elevation: z.number().nullable(),
    }),
  ),
});

export interface OpenElevationConfig {
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
// caller actually relies on env-derived defaults — keeping unit tests that
// inject `baseUrl` free of any env setup. Mirrors the OpenTopoData client.
let serverEnvPromise: Promise<typeof import("@trek-together/env/server")> | undefined;
function loadServerEnv() {
  serverEnvPromise ??= import("@trek-together/env/server");
  return serverEnvPromise;
}

/**
 * Secondary elevation provider client for Open-Elevation, implementing the
 * shared {@link ElevationProvider} interface (T1.2). Stateless and
 * single-request: batching (≤100/req) and rate limiting (≤1 req/s) are layered
 * on separately (T1.3), and all reads are expected to flow through the cache
 * wrapper (T1.5) rather than calling this directly. Used as the fallback when
 * OpenTopoData errors or is exhausted (T1.6).
 */
export function createOpenElevationProvider(config: OpenElevationConfig = {}): ElevationProvider {
  let resolved: ResolvedConfig | undefined;

  async function resolveConfig(): Promise<ResolvedConfig> {
    if (resolved) return resolved;
    resolved = {
      baseUrl: config.baseUrl ?? (await loadServerEnv()).env.OPEN_ELEVATION_BASE_URL,
      fetch: config.fetch ?? globalThis.fetch,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
    return resolved;
  }

  async function lookup(points: LatLng[]): Promise<ElevationPoint[]> {
    if (points.length === 0) return [];

    const { baseUrl, fetch: doFetch, timeoutMs } = await resolveConfig();

    let response: Response;
    try {
      response = await doFetch(`${baseUrl}/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify({
          locations: points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      throw new ElevationProviderError("Elevation request failed", {
        provider: PROVIDER,
        cause,
      });
    }

    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after"));
      throw new ElevationProviderError(`Elevation request returned HTTP ${response.status}`, {
        provider: PROVIDER,
        status: response.status,
        retryAfterS: Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined,
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new ElevationProviderError("Elevation response was not valid JSON", {
        provider: PROVIDER,
        status: response.status,
        cause,
      });
    }

    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ElevationProviderError("Elevation response had an unexpected shape", {
        provider: PROVIDER,
        status: response.status,
        cause: parsed.error,
      });
    }

    if (parsed.data.results.length !== points.length) {
      throw new ElevationProviderError(
        `Elevation provider returned ${parsed.data.results.length} results for ${points.length} points`,
        { provider: PROVIDER, status: response.status },
      );
    }

    return points.map((point, index) => {
      const result = parsed.data.results[index];
      if (!result) {
        // unreachable: results length verified equal to points above
        throw new ElevationProviderError(`Missing elevation result at index ${index}`, {
          provider: PROVIDER,
          status: response.status,
        });
      }
      return {
        lat: point.lat,
        lng: point.lng,
        elevationM: result.elevation,
        dataset: SOURCE,
      };
    });
  }

  return { name: PROVIDER, lookup };
}
