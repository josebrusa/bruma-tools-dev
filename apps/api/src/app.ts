import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { and, eq, isNull } from "drizzle-orm";
import { config } from "./config.js";
import { checkDbConnection, db } from "./db/index.js";
import { tenantApiKeys } from "./db/schema.js";
import { registerV1Routes } from "./routes/v1.js";
import { unauthorized, tooManyRequests } from "./lib/errors.js";
import { sha256Hex } from "./lib/crypto-secret.js";
import { MinuteWindowLimiter } from "./lib/rate-limit-window.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiSpecPath = path.join(__dirname, "../openapi/openapi.yaml");

const keyLimit = config.rateLimitEnabled ? config.rateLimitMax : 0;
const tenantLimit = config.rateLimitEnabled ? config.rateLimitMaxTenant : 0;
const keyLimiter = new MinuteWindowLimiter(keyLimit, config.rateLimitWindowMs);
const tenantLimiter = new MinuteWindowLimiter(
  tenantLimit,
  config.rateLimitWindowMs,
);

export async function buildApp() {
  const app = Fastify({
    requestTimeout: config.requestTimeoutMs,
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug",
      redact: {
        paths: [
          "req.headers.authorization",
          'req.headers["x-api-key"]',
          'req.headers["X-API-Key"]',
        ],
        censor: "[Redacted]",
      },
    },
  });

  app.decorateRequest("auth", null);
  app.decorateRequest("correlationId", "");

  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
  });

  if (config.openApiDocsEnabled) {
    await app.register(swagger, {
      mode: "static",
      specification: {
        path: openApiSpecPath,
        baseDir: path.dirname(openApiSpecPath),
      },
    });
    await app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: { docExpansion: "list" },
    });
  }

  app.addHook("preParsing", async (request, _reply, payload) => {
    const path = request.url.split("?")[0] ?? "";
    if (path !== "/v1/webhooks/provider" || request.method !== "POST") {
      return payload;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of payload as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks);
    request.rawBody = raw;
    return Readable.from(raw);
  });

  app.get("/health", async (_req, reply) => {
    const dbOk = await checkDbConnection();
    return reply.send({
      status: "ok",
      database: dbOk ? "up" : "down",
    });
  });

  app.addHook("onRequest", async (req, reply) => {
    const incoming =
      typeof req.headers["x-request-id"] === "string"
        ? req.headers["x-request-id"].trim()
        : "";
    const correlationId =
      incoming.length > 0 && incoming.length <= 128
        ? incoming
        : randomUUID();
    req.correlationId = correlationId;
    reply.header("X-Request-Id", correlationId);
    req.log = req.log.child({ correlation_id: correlationId });

    const path = req.url.split("?")[0] ?? "";
    if (!path.startsWith("/v1/")) return;

    if (path === "/v1/webhooks/provider" && req.method === "POST") {
      req.auth = null;
      return;
    }

    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || !key.trim()) {
      return unauthorized(reply);
    }
    const k = key.trim();
    const keyBucket = `api_key:${sha256Hex(k).slice(0, 24)}`;
    const keyCheck = keyLimiter.consume(keyBucket);
    if (!keyCheck.ok) {
      return tooManyRequests(reply, keyCheck.retryAfterSec);
    }

    if (config.adminApiKey && k === config.adminApiKey) {
      req.auth = { kind: "admin" };
      return;
    }
    const hash = sha256Hex(k);
    const [row] = await db
      .select()
      .from(tenantApiKeys)
      .where(
        and(eq(tenantApiKeys.keyHash, hash), isNull(tenantApiKeys.revokedAt)),
      )
      .limit(1);
    if (!row) {
      return unauthorized(reply);
    }
    req.auth = { kind: "tenant", tenantId: row.tenantId };

    const tenantCheck = tenantLimiter.consume(`tenant:${row.tenantId}`);
    if (!tenantCheck.ok) {
      return tooManyRequests(reply, tenantCheck.retryAfterSec);
    }
  });

  await registerV1Routes(app);

  return app;
}
