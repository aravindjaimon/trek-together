import { createOpenElevationProvider, type OpenElevationConfig } from "./open-elevation";
import { createOpenTopoDataProvider, type OpenTopoDataConfig } from "./opentopodata";
import type { ElevationProvider } from "./types";

export { createOpenElevationProvider } from "./open-elevation";
export { createOpenTopoDataProvider } from "./opentopodata";
export type { ElevationProvider } from "./types";

/** Names of the elevation providers, matching the `ELEVATION_PROVIDER` env enum. */
export type ProviderName = "opentopodata" | "open-elevation";

export interface GetProviderConfig {
  opentopodata?: OpenTopoDataConfig;
  "open-elevation"?: OpenElevationConfig;
}

/**
 * Resolve an {@link ElevationProvider} by name. When `name` is omitted the
 * configured `ELEVATION_PROVIDER` is used. An explicit unknown name throws so
 * mis-wiring surfaces loudly (the env enum already constrains the config path).
 */
export function getProvider(name: ProviderName, config: GetProviderConfig = {}): ElevationProvider {
  switch (name) {
    case "opentopodata":
      return createOpenTopoDataProvider(config.opentopodata);
    case "open-elevation":
      return createOpenElevationProvider(config["open-elevation"]);
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown elevation provider: ${String(exhaustive)}`);
    }
  }
}
