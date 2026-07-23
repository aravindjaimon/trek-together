import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });

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
    // Local daily circuit breaker matching the public host's ~1000 calls/day.
    OPENTOPODATA_DAILY_LIMIT: z.coerce.number().int().positive().default(1000),
    OPEN_ELEVATION_BASE_URL: z.url().default("https://api.open-elevation.com/api/v1"),
    // Routing (waypoint → trail snapping) config — optional so the app boots
    // without a token; the snap procedure fails safe to straight lines if unset.
    ROUTING_PROVIDER: z.enum(["mapbox"]).default("mapbox"),
    MAPBOX_ACCESS_TOKEN: z.string().optional(),
    MAPBOX_DIRECTIONS_URL: z.url().default("https://api.mapbox.com/directions/v5/mapbox/walking"),
    // Geocoding (place search) config — Nominatim is keyless; defaults baked in.
    GEOCODING_PROVIDER: z.enum(["nominatim"]).default("nominatim"),
    NOMINATIM_BASE_URL: z.url().default("https://nominatim.openstreetmap.org"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
