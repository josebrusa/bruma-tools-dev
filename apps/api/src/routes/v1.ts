import type { FastifyInstance } from "fastify";
import { eq, and, asc } from "drizzle-orm";
import { randomBytes, generateKeyPairSync } from "node:crypto";
import { z } from "zod";
import { db } from "../db/index.js";
import { domains, tenants } from "../db/schema.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../lib/errors.js";
import { fqdnSchema, normalizeFqdn, slugSchema } from "../lib/tenant-domain.js";
import { buildDnsBundle } from "../services/dns-records.js";
import { verifyDomainDns } from "../services/dns-verify.js";
import { ensureAdmin, ensureTenantAccess } from "../lib/tenant-access.js";
import { isUuid } from "../lib/uuid.js";
import { registerSprint2Routes } from "./sprint2.js";
import { registerSprint4Routes } from "./sprint4.js";
import { registerSprint3Routes } from "./sprint3.js";

const createTenantBody = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(200),
  contact: z.string().max(500).optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
});

const patchTenantBody = z
  .object({
    name: z.string().min(1).max(200).optional(),
    contact: z.string().max(500).optional().nullable(),
    timezone: z.string().max(100).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty patch" });

const createDomainBody = z.object({
  fqdn: z.string().transform((s) => normalizeFqdn(s)),
});

function mapTenant(row: typeof tenants.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    contact: row.contact,
    timezone: row.timezone,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapDomain(row: typeof domains.$inferSelect) {
  return {
    id: row.id,
    tenant_id: row.tenantId,
    fqdn: row.fqdn,
    verification_status: row.verificationStatus,
    verification_error: row.verificationError,
    verified_at: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function registerV1Routes(app: FastifyInstance) {
  app.get("/v1/tenants", async (req, reply) => {
    const auth = req.auth;
    if (!auth) return forbidden(reply, "Missing authorization context");
    if (auth.kind === "tenant") {
      const [row] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, auth.tenantId))
        .limit(1);
      return reply.send({ data: row ? [mapTenant(row)] : [] });
    }
    const rows = await db.select().from(tenants).orderBy(asc(tenants.slug));
    return reply.send({ data: rows.map(mapTenant) });
  });

  app.post("/v1/tenants", async (req, reply) => {
    if (!ensureAdmin(req, reply)) return;
    const parsed = createTenantBody.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(reply, "Validation failed", parsed.error.flatten());
    }
    const body = parsed.data;
    try {
      const [row] = await db
        .insert(tenants)
        .values({
          slug: body.slug,
          name: body.name,
          contact: body.contact ?? null,
          timezone: body.timezone ?? null,
        })
        .returning();
      return reply.status(201).send(mapTenant(row));
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "23505") {
        return conflict(reply, "Tenant slug already exists");
      }
      throw e;
    }
  });

  app.get<{ Params: { id: string } }>("/v1/tenants/:id", async (req, reply) => {
    if (!isUuid(req.params.id)) {
      return badRequest(reply, "Invalid tenant id");
    }
    if (!ensureTenantAccess(req, reply, req.params.id)) return;
    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.params.id))
      .limit(1);
    if (!row) return notFound(reply, "Tenant not found");
    return reply.send(mapTenant(row));
  });

  app.patch<{ Params: { id: string } }>(
    "/v1/tenants/:id",
    async (req, reply) => {
      if (!isUuid(req.params.id)) {
        return badRequest(reply, "Invalid tenant id");
      }
      if (!ensureTenantAccess(req, reply, req.params.id)) return;
      const parsed = patchTenantBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const body = parsed.data;
      const [existing] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, req.params.id))
        .limit(1);
      if (!existing) return notFound(reply, "Tenant not found");

      const updates: {
        name?: string;
        contact?: string | null;
        timezone?: string | null;
        isActive?: boolean;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.contact !== undefined) updates.contact = body.contact ?? null;
      if (body.timezone !== undefined) updates.timezone = body.timezone ?? null;
      if (body.isActive !== undefined) updates.isActive = body.isActive;

      const [row] = await db
        .update(tenants)
        .set(updates)
        .where(eq(tenants.id, req.params.id))
        .returning();
      return reply.send(mapTenant(row!));
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/domains",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [tenantRow] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, req.params.tenantId))
        .limit(1);
      if (!tenantRow) return notFound(reply, "Tenant not found");
      if (!tenantRow.isActive) {
        return forbidden(
          reply,
          "Tenant is inactive; domain operations are blocked",
        );
      }

      const parsed = createDomainBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const fqdnCheck = fqdnSchema.safeParse(parsed.data.fqdn);
      if (!fqdnCheck.success) {
        return badRequest(reply, "Invalid FQDN", fqdnCheck.error.flatten());
      }
      const fqdn = fqdnCheck.data;

      const selector = `bruma${randomBytes(3).toString("hex")}`;
      const { publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      try {
        const [row] = await db
          .insert(domains)
          .values({
            tenantId: tenantRow.id,
            fqdn,
            verificationStatus: "pending",
            dkimSelector: selector,
            dkimPublicKeyPem: publicKey,
          })
          .returning();
        return reply.status(201).send(mapDomain(row));
      } catch (e) {
        const err = e as { code?: string };
        if (err.code === "23505") {
          return conflict(reply, "Domain already registered for this tenant");
        }
        throw e;
      }
    },
  );

  app.get<{
    Params: { tenantId: string; domainId: string };
  }>("/v1/tenants/:tenantId/domains/:domainId/dns-records", async (req, reply) => {
    if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
    const [row] = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.id, req.params.domainId),
          eq(domains.tenantId, req.params.tenantId),
        ),
      )
      .limit(1);
    if (!row) return notFound(reply, "Domain not found");
    if (!row.dkimSelector || !row.dkimPublicKeyPem) {
      return badRequest(reply, "Domain is missing DKIM material");
    }
    const bundle = buildDnsBundle({
      fqdn: row.fqdn,
      dkimSelector: row.dkimSelector,
      dkimPublicKeyPem: row.dkimPublicKeyPem,
    });
    return reply.send({
      domain_id: row.id,
      fqdn: row.fqdn,
      records: bundle,
    });
  });

  app.post<{
    Params: { tenantId: string; domainId: string };
  }>("/v1/tenants/:tenantId/domains/:domainId/verify", async (req, reply) => {
    if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
    const [tenantRow] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.params.tenantId))
      .limit(1);
    if (!tenantRow) return notFound(reply, "Tenant not found");
    if (!tenantRow.isActive) {
      return forbidden(reply, "Tenant is inactive; verification blocked");
    }

    const [row] = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.id, req.params.domainId),
          eq(domains.tenantId, req.params.tenantId),
        ),
      )
      .limit(1);
    if (!row) return notFound(reply, "Domain not found");
    if (!row.dkimSelector || !row.dkimPublicKeyPem) {
      return badRequest(reply, "Domain is missing DKIM material");
    }

    const result = await verifyDomainDns({
      fqdn: row.fqdn,
      dkimSelector: row.dkimSelector,
      dkimPublicKeyPem: row.dkimPublicKeyPem,
    });

    const now = new Date();
    if (result.ok) {
      const [updated] = await db
        .update(domains)
        .set({
          verificationStatus: "verified",
          verificationError: null,
          verifiedAt: now,
          updatedAt: now,
        })
        .where(eq(domains.id, row.id))
        .returning();
      return reply.send(mapDomain(updated!));
    }

    const [updated] = await db
      .update(domains)
      .set({
        verificationStatus: "error",
        verificationError: result.reason,
        verifiedAt: null,
        updatedAt: now,
      })
      .where(eq(domains.id, row.id))
      .returning();
    return reply.status(422).send(mapDomain(updated!));
  });

  await registerSprint2Routes(app);
  await registerSprint3Routes(app);
  await registerSprint4Routes(app);
}
