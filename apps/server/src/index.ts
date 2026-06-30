import { OpenAPIHandler } from "@orpc/openapi/node";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { BodyLimitPlugin, RPCHandler } from "@orpc/server/node";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@trek-together/api/context";
import { appRouter } from "@trek-together/api/routers/index";
import { auth } from "@trek-together/auth";
import { env } from "@trek-together/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

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
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

const rpcHandler = new RPCHandler(appRouter, {
  plugins: [new BodyLimitPlugin({ maxBodySize: MAX_BODY_BYTES })],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new BodyLimitPlugin({ maxBodySize: MAX_BODY_BYTES }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use(async (req, res, next) => {
  const rpcResult = await rpcHandler.handle(req, res, {
    prefix: "/rpc",
    context: await createContext({ req }),
  });
  if (rpcResult.matched) return;

  const apiResult = await apiHandler.handle(req, res, {
    prefix: "/api-reference",
    context: await createContext({ req }),
  });
  if (apiResult.matched) return;

  next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
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

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
