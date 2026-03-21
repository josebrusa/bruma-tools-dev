import type { AuthPrincipal } from "../lib/auth-principal.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthPrincipal | null;
    correlationId: string;
    rawBody?: Buffer;
  }
}
