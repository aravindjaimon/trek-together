import { randomUUID } from "node:crypto";
import { OpenAPIHandler } from "@orpc/openapi/node";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { BodyLimitPlugin, RPCHandler } from "@orpc/server/node";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@trek-together/api/context";
import { appRouter } from "@trek-together/api/routers/index";
import { auth } from "@trek-together/auth";
import prisma from "@trek-together/db";
import { verifyIndexes } from "@trek-together/db/verify-indexes";
import { env } from "@trek-together/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { findShadowedAddresses, INSTANCE_HEADER, SELF_CHECK_HEADER } from "./self-check";

// Per-process id, echoed on / and used to tell a real client apart from our
// own port-ownership probes (see self-check.ts).
const INSTANCE_ID = randomUUID();

/** oRPC reads the raw stream itself, so the body cap must be its plugin — the
 * express.json limit below never sees /rpc traffic. 1 MiB is generous: a
 * 3000-vertex path is ~150 kB. */
const MAX_BODY_BYTES = 1_048_576;

const app = express();

// One proxy hop in production (ALB/reverse proxy) so req.ip and Better-Auth's
// x-forwarded-for lookup see the real client, not the proxy — without letting
// dev clients spoof the header to dodge rate limits.
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

// Security headers first (T10.8) — helmet's CORP header exempts CORS-mode
// requests, so the cross-origin web client still works. CSP is off: the only
// HTML this server serves is /api-reference, whose Scalar UI loads from a CDN
// that script-src 'self' would block; everything else is JSON.
app.use(helmet({ contentSecurityPolicy: false }));

// Request id + one-line JSON access log (T10.10). The id is echoed as a
// response header and flows into the oRPC context, so a client-reported error
// correlates to exactly one server log line.
app.use((req, res, next) => {
  const header = req.headers["x-request-id"];
  const requestId = typeof header === "string" && header.length > 0 ? header : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  const startedAt = Date.now();
  res.on("finish", () => {
    // Skip access-log noise for our own port-ownership self-checks (self-check.ts).
    if (req.headers[SELF_CHECK_HEADER] === INSTANCE_ID) return;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - startedAt,
      }),
    );
  });
  next();
});

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Coarse per-IP backstop across /api/auth/* and /rpc (T10.8). Better-Auth
// layers stricter sign-in rules on top (packages/auth).
app.use(
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    // Our own port-ownership probes (self-check.ts) shouldn't spend the
    // budget — the header value is a per-process UUID, so unguessable.
    skip: (req) => req.headers[SELF_CHECK_HEADER] === INSTANCE_ID,
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

// Expected request-level outcomes (401/404/bad input) are visible in the
// access log's status code; error-logging them buries real faults (T10.10).
const EXPECTED_ORPC_CODES = new Set(["UNAUTHORIZED", "NOT_FOUND", "BAD_REQUEST", "VALIDATION"]);

function logUnexpectedError(error: unknown) {
  if (error instanceof ORPCError && EXPECTED_ORPC_CODES.has(error.code)) return;
  console.error("[rpc]", error);
}

const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new BodyLimitPlugin({ maxBodySize: MAX_BODY_BYTES })],
  interceptors: [onError(logUnexpectedError)],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new BodyLimitPlugin({ maxBodySize: MAX_BODY_BYTES }),
  ],
  interceptors: [onError(logUnexpectedError)],
});

app.use(async (req, res, next) => {
  const requestId = res.locals.requestId as string;
  const rpcResult = await rpcHandler.handle(req, res, {
    prefix: "/rpc",
    context: await createContext({ req, requestId }),
  });
  if (rpcResult.matched) return;

  const apiResult = await apiHandler.handle(req, res, {
    prefix: "/api-reference",
    context: await createContext({ req, requestId }),
  });
  if (apiResult.matched) return;

  next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.setHeader(INSTANCE_HEADER, INSTANCE_ID);
  res.status(200).send("OK");
});

// Readiness: reflects Mongo, so an orchestrator/LB stops routing to a server
// that would 500 every DB call (T10.9). `GET /` above stays pure liveness.
app.get("/health", async (_req, res) => {
  try {
    await Promise.race([
      prisma.$runCommandRaw({ ping: 1 }),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("db ping timed out")), 2000),
      ),
    ]);
    res.status(200).json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

// Centralized error backstop (T3.4): anything that escapes the oRPC handlers
// (e.g. an express.json body-parse error) is logged in full server-side and
// returned to the client as a safe, generic envelope — never a stack trace
// (PROJECT-SPEC.md §11). Typed oRPC errors are already serialized upstream.
const errorHandler: express.ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`[server] unhandled error on ${req.method} ${req.path}:`, err);
  if (res.headersSent) return;
  res.status(500).json({
    error: { code: "INTERNAL", message: "An unexpected error occurred." },
  });
};
app.use(errorHandler);

// A successful listen() doesn't prove clients can reach us — on macOS/BSD a
// squatter bound to a specific loopback address (e.g. `[::1]:PORT`) can
// coexist with our wildcard bind, silently stealing `localhost` traffic with
// no EADDRINUSE. Dev dies loudly on this since a lying "running" log wastes
// hours; prod only warns, since an unusual localhost-routing setup shouldn't
// kill an otherwise-healthy server.
async function checkPortOwnership() {
  const shadowed = await findShadowedAddresses(env.PORT, INSTANCE_ID);
  if (shadowed.length === 0) return;
  console.error(
    `[startup] PORT ${env.PORT} SHADOWED on ${shadowed.join(", ")} — another process holds that ` +
      `address, so clients hitting http://localhost:${env.PORT} reach it, not us. ` +
      `Find it: sudo lsof -nP -iTCP:${env.PORT} -sTCP:LISTEN`,
  );
  if (env.NODE_ENV !== "production") process.exit(1);
}

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
  void checkPortOwnership();
  if (env.NODE_ENV !== "production") {
    // A squatter can also show up after we've already started — re-check
    // periodically instead of trusting the one-time startup log forever.
    setInterval(() => void checkPortOwnership(), 30_000).unref();
  }
  // Warn loudly (don't crash) when the out-of-band Mongo indexes are missing —
  // a raw `prisma db push` drops them; `pnpm db:push` restores them (T10.9).
  verifyIndexes(prisma)
    .then((missing) => {
      for (const m of missing) {
        console.error(
          `[startup] MISSING INDEX ${m.collection}.${m.index} — run \`pnpm db:push\` (never raw \`prisma db push\`) to restore TTL/geo behaviour`,
        );
      }
    })
    .catch((err) => {
      console.warn("[startup] index verification skipped:", err);
    });
});

// Graceful shutdown (T10.9): stop accepting, drain in-flight requests, then
// close Mongo — with a 10s force-exit cap so a hung connection can't wedge us.
function shutdown(signal: string) {
  console.log(`[shutdown] ${signal} received — draining connections`);
  const force = setTimeout(() => {
    console.error("[shutdown] force exit after 10s");
    process.exit(1);
  }, 10_000);
  force.unref();
  server.close(() => {
    void prisma
      .$disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Crash visibly instead of Node's silent default; the supervisor restarts us.
process.on("unhandledRejection", (reason) => {
  console.error("[fatal] unhandled rejection:", reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaught exception:", err);
  process.exit(1);
});
