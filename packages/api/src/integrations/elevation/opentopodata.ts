import { z } from "zod";
import { type ElevationPoint, ElevationProviderError, type LatLng } from "./types";

const PROVIDER = "opentopodata";
const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = "trek-together/0.1 (elevation client)";

/** Shape of a successful OpenTopoData response (https://www.opentopodata.org/api/). */
const responseSchema = z.object({
  status: z.string(),
  results: z.array(
    z.object({
      elevation: z.number().nullable(),
      location: z.object({ lat: z.number(), lng: z.number() }),
      dataset: z.string(),
    }),
  ),
});

export interface OpenTopoDataConfig {
  baseUrl?: string;
  dataset?: string;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

interface ResolvedConfig {
  baseUrl: string;
  dataset: string;
  fetch: typeof fetch;
  timeoutMs: number;
}

// Cached so env is imported (and validated) at most once, and only when a
// caller actually relies on env-derived defaults — keeping unit tests that
// inject `baseUrl`/`dataset` free of any env setup.
let serverEnvPromise: Promise<typeof import("@trek-together/env/server")> | undefined;
function loadServerEnv() {
  serverEnvPromise ??= import("@trek-together/env/server");
  return serverEnvPromise;
}

/**
 * Primary elevation provider client for OpenTopoData. Stateless and
 * single-request: batching (≤100/req) and rate limiting (≤1 req/s) are layered
 * on separately (T1.3), and all reads are expected to flow through the cache
 * wrapper (T1.5) rather than calling this directly.
 */
export function createOpenTopoDataProvider(config: OpenTopoDataConfig = {}) {
  let resolved: ResolvedConfig | undefined;

  async function resolveConfig(): Promise<ResolvedConfig> {
    if (resolved) return resolved;
    resolved = {
      baseUrl: config.baseUrl ?? (await loadServerEnv()).env.OPENTOPODATA_BASE_URL,
      dataset: config.dataset ?? (await loadServerEnv()).env.OPENTOPODATA_DATASET,
      fetch: config.fetch ?? globalThis.fetch,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
    return resolved;
  }

  async function lookup(points: LatLng[]): Promise<ElevationPoint[]> {
    if (points.length === 0) return [];

    const { baseUrl, dataset, fetch: doFetch, timeoutMs } = await resolveConfig();
    const locations = points.map((p) => `${p.lat},${p.lng}`).join("|");

    let response: Response;
    try {
      response = await doFetch(`${baseUrl}/${dataset}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify({ locations }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      throw new ElevationProviderError("Elevation request failed", {
        provider: PROVIDER,
        cause,
      });
    }

    if (!response.ok) {
      throw new ElevationProviderError(`Elevation request returned HTTP ${response.status}`, {
        provider: PROVIDER,
        status: response.status,
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

    if (parsed.data.status !== "OK") {
      throw new ElevationProviderError(
        `Elevation provider reported status "${parsed.data.status}"`,
        { provider: PROVIDER, status: response.status },
      );
    }

    if (parsed.data.results.length !== points.length) {
      throw new ElevationProviderError(
        `Elevation provider returned ${parsed.data.results.length} results for ${points.length} points`,
        { provider: PROVIDER, status: response.status },
      );
    }

    return points.map((point, index) => ({
      lat: point.lat,
      lng: point.lng,
      elevationM: parsed.data.results[index].elevation,
      dataset: parsed.data.results[index].dataset,
    }));
  }

  return { lookup };
}
