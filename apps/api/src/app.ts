import Fastify from "fastify";
import cors from "@fastify/cors";
import { and, eq, isNull } from "drizzle-orm";
import { config } from "./config.js";
import { checkDbConnection, db } from "./db/index.js";
import { tenantApiKeys } from "./db/schema.js";
import { registerV1Routes } from "./routes/v1.js";
import { unauthorized } from "./lib/errors.js";
import { sha256Hex } from "./lib/crypto-secret.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.decorateRequest("auth", null);

  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
  });

  app.get("/health", async (_req, reply) => {
    const dbOk = await checkDbConnection();
    return reply.send({
      status: "ok",
      database: dbOk ? "up" : "down",
    });
  });

  app.addHook("onRequest", async (req, reply) => {
    if (!req.url.startsWith("/v1/")) return;
    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || !key.trim()) {
      return unauthorized(reply);
    }
    const k = key.trim();
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
  });

  await registerV1Routes(app);

  return app;
}
