import type { FastifyReply, FastifyRequest } from "fastify";
import { forbidden } from "./errors.js";

export function ensureTenantAccess(
  req: FastifyRequest,
  reply: FastifyReply,
  tenantId: string,
): boolean {
  const auth = req.auth;
  if (!auth) {
    void forbidden(reply, "Missing authorization context");
    return false;
  }
  if (auth.kind === "admin") return true;
  if (auth.kind === "tenant" && auth.tenantId === tenantId) return true;
  void forbidden(reply, "Not allowed to access this tenant");
  return false;
}

export function ensureAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): boolean {
  const auth = req.auth;
  if (!auth || auth.kind !== "admin") {
    void forbidden(reply, "Admin API key required");
    return false;
  }
  return true;
}
