import "dotenv/config";

function parseOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["http://localhost:5173"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminApiKey: process.env.ADMIN_API_KEY ?? "",
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
};
