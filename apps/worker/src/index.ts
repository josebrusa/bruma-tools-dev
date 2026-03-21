import "dotenv/config";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), "[worker]", ...args);
}

log("starting placeholder worker (queue consumer in later sprints)");
log("REDIS_URL =", redisUrl.replace(/:[^:@/]+@/, ":****@"));

setInterval(() => {
  log("idle heartbeat");
}, 60_000);
