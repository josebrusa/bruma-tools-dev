import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { checkDbConnection } from "./db/index.js";
import { registerV1Routes } from "./routes/v1.js";
import { unauthorized } from "./lib/errors.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

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
    const expected = config.adminApiKey;
    if (!expected) {
      app.log.warn("ADMIN_API_KEY is not set; rejecting /v1 requests");
      return unauthorized(reply, "Server misconfiguration: missing ADMIN_API_KEY");
    }
    if (typeof key !== "string" || key !== expected) {
      return unauthorized(reply);
    }
  });

  await registerV1Routes(app);

  return app;
}
