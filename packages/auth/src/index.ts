import { createPrismaClient } from "@trek-together/db";
import { env } from "@trek-together/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
  const prisma = createPrismaClient();
  // Cross-site cookies (sameSite "none" + secure) require HTTPS, so they never
  // persist over plain http://localhost. Relax them outside production so the
  // local dev flow works; keep them strict in production.
  const isProd = env.NODE_ENV === "production";

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "mongodb",
    }),

    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
