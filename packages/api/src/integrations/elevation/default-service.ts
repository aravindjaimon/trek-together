import { env } from "@trek-together/env/server";

import { createPrismaElevationCacheRepo } from "../../data/elevation-cache.repo";
import { createElevationService } from "./cache";
import { getProvider, type ProviderName } from "./index";

type Db = NonNullable<Parameters<typeof createPrismaElevationCacheRepo>[0]>;

export interface DefaultElevationServiceOptions {
  db: Db;
  requestId?: string;
}

/**
 * Build the production elevation client (T3.3 glue): Prisma-backed cache repo +
 * the configured primary provider, with the other provider wired as fallback
 * (T1.6). This is the single seam the procedure uses and the benchmark reuses;
 * integration tests `vi.mock` this module to stay offline.
 */
export function createDefaultElevationService(opts: DefaultElevationServiceOptions) {
  const primary = env.ELEVATION_PROVIDER as ProviderName;
  const fallback: ProviderName = primary === "opentopodata" ? "open-elevation" : "opentopodata";

  return createElevationService({
    repo: createPrismaElevationCacheRepo(opts.db),
    provider: getProvider(primary),
    fallbackProvider: getProvider(fallback),
    datasetNamespace: env.OPENTOPODATA_DATASET,
    requestId: opts.requestId,
  });
}
