import { createPrismaClient } from "@trek-together/db";
import { env } from "@trek-together/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
  const prisma = createPrismaClient();
  // Drive cookie hardening off the actual transport (the Better-Auth base URL),
  // not NODE_ENV. Secure / cross-site cookies require HTTPS and never persist over
  // plain http://localhost; tying them to the URL scheme is fail-secure — a
  // deployed HTTPS base URL always yields secure cookies even if NODE_ENV is
  // misconfigured, while local http stays relaxed so the dev flow works.
  const isSecureOrigin = env.BETTER_AUTH_URL.startsWith("https://");

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "mongodb",
    }),

    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    // Explicitly on in every environment (Better-Auth's default is prod-only):
    // its built-in per-path rules throttle sign-in/sign-up harder than the
    // coarse per-IP Express backstop (T10.8). In-memory storage — one process.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: isSecureOrigin ? "none" : "lax",
        secure: isSecureOrigin,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
