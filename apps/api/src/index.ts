import { buildApp } from "./app.js";
import { config } from "./config.js";
import { closeQueues } from "./lib/queue.js";

const app = await buildApp();

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  try {
    await closeQueues();
  } catch (e) {
    app.log.warn(e, "queue close warning");
  }
  await app.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
