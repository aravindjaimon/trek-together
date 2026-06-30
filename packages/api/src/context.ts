import { randomUUID } from "node:crypto";
import { auth } from "@trek-together/auth";
import prisma from "@trek-together/db";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";

interface CreateContextOptions {
  req: Request;
  /** Shared with the Express access log (T10.10), so one id correlates both. */
  requestId?: string;
}

export async function createContext(opts: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(opts.req.headers),
  });
  return {
    db: prisma,
    session,
    requestId: opts.requestId ?? randomUUID(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
