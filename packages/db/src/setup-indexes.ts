import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load the server env (DATABASE_URL) the same way ping.ts / prisma.config.ts do,
// resolved relative to this file so it works regardless of the caller's cwd.
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/server/.env");
dotenv.config({ path: envPath });

/**
 * Out-of-band index setup for indexes Prisma can't express. Run AFTER every
 * `prisma db push`: on MongoDB, push reconciles indexes to the schema and can
 * drop ones it doesn't manage (like a TTL index). Every createIndex here is
 * idempotent (fixed name + spec ⇒ no-op on re-run).
 *
 * Currently just the `elevationCache` TTL index (M1 / T1.4). The routes
 * `2dsphere` geo-index (T4.2) will be added here too.
 */

// 30-day TTL — SRTM is near-static, so a long TTL maximises cache hits while
// letting dataset revisions / quota resets self-heal. Decision recorded for T9.4.
// Kept in sync with CACHE_TTL_S in packages/api/.../elevation/constants.ts
// (duplicated, not imported, to avoid a db→api dependency cycle).
const ELEVATION_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

async function main() {
  // Import the client only after env is loaded — it reads DATABASE_URL at module load.
  const { default: prisma } = await import("./index");
  try {
    const result = await prisma.$runCommandRaw({
      createIndexes: "elevationCache",
      indexes: [
        {
          key: { fetchedAt: 1 },
          name: "fetchedAt_ttl",
          expireAfterSeconds: ELEVATION_CACHE_TTL_SECONDS,
        },
      ],
    });
    console.log("elevationCache indexes ensured:", JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Index setup failed:", error);
  process.exitCode = 1;
});
