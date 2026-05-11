import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Elevation provider config — optional (defaults baked in); wired in M1.
    ELEVATION_PROVIDER: z.enum(["opentopodata", "open-elevation"]).default("opentopodata"),
    OPENTOPODATA_BASE_URL: z.url().default("https://api.opentopodata.org/v1"),
    OPENTOPODATA_DATASET: z.string().min(1).default("srtm30m"),
    OPEN_ELEVATION_BASE_URL: z.url().default("https://api.open-elevation.com/api/v1"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
