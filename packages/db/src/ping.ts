import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load the server env (DATABASE_URL) the same way prisma.config.ts does, resolved
// relative to this file so the smoke check works regardless of the caller's cwd.
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/server/.env");
dotenv.config({ path: envPath });

async function main() {
  // Import the client only after env is loaded — the client is instantiated at
  // module load and reads DATABASE_URL then.
  const { default: prisma } = await import("./index");
  try {
    const result = await prisma.$runCommandRaw({ ping: 1 });
    console.log("MongoDB ping ok:", JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("MongoDB ping failed:", error);
  process.exitCode = 1;
});
