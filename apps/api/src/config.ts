import "dotenv/config";

function parseOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["http://localhost:5173"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const config = {
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminApiKey: process.env.ADMIN_API_KEY ?? "",
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  redisUrl: process.env.REDIS_URL ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  requestTimeoutMs: Math.max(
    1000,
    parseInt(process.env.REQUEST_TIMEOUT_MS ?? "30000", 10) || 30000,
  ),
  rateLimitMax: Math.max(1, parseInt(process.env.API_RATE_LIMIT_MAX ?? "300", 10) || 300),
  rateLimitWindowMs: Math.max(
    1000,
    parseInt(process.env.API_RATE_LIMIT_WINDOW_MS ?? "60000", 10) || 60000,
  ),
  rateLimitEnabled: envBool("API_RATE_LIMIT_ENABLED", true),
  /** Per-tenant bucket max (same window as API_RATE_LIMIT_WINDOW_MS). */
  rateLimitMaxTenant: Math.max(
    1,
    parseInt(process.env.API_RATE_LIMIT_MAX_TENANT ?? "600", 10) || 600,
  ),
  webhookSecret: process.env.WEBHOOK_SECRET ?? "",
  openApiDocsEnabled: envBool("OPENAPI_DOCS_ENABLED", nodeEnv !== "production"),
};
