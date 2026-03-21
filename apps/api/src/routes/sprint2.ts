import type { FastifyInstance } from "fastify";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  brandingProfiles,
  domains,
  emailTemplateVersions,
  emailTemplates,
  eventMappings,
  senderIdentities,
  tenantApiKeys,
  tenants,
} from "../db/schema.js";
import {
  badRequest,
  conflict,
  notFound,
} from "../lib/errors.js";
import { ensureTenantAccess } from "../lib/tenant-access.js";
import {
  generateApiKeySecret,
  keyPrefixFromSecret,
  sha256Hex,
} from "../lib/crypto-secret.js";
import { renderWithOptionalBranding } from "../services/template-render.js";

const emailSchema = z.string().email();
const urlSchema = z.string().url();

const createSenderBody = z.object({
  domain_id: z.string().uuid(),
  email: emailSchema,
  display_name: z.string().min(1).max(200),
  reply_to: emailSchema.optional().nullable(),
});

const brandingBody = z.object({
  logo_url: urlSchema,
  color_primario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "must be hex like #RRGGBB"),
});

const createTemplateBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
});

const createVersionBody = z.object({
  body_html: z.string().min(1),
  variable_names: z.array(z.string().min(1)).default([]),
});

const publishBody = z.object({
  version_id: z.string().uuid(),
});


const createApiKeyBody = z.object({
  name: z.string().min(1).max(120),
});

function mapSender(row: typeof senderIdentities.$inferSelect) {
  return {
    id: row.id,
    tenant_id: row.tenantId,
    domain_id: row.domainId,
    email: row.email,
    display_name: row.displayName,
    reply_to: row.replyTo,
    state: row.state,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapTemplate(row: typeof emailTemplates.$inferSelect) {
  return {
    id: row.id,
    tenant_id: row.tenantId,
    name: row.name,
    description: row.description,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapVersion(row: typeof emailTemplateVersions.$inferSelect) {
  return {
    id: row.id,
    template_id: row.templateId,
    body_html: row.bodyHtml,
    variable_names: JSON.parse(row.variableNames) as string[],
    is_active: row.isActive,
    version: row.version,
    created_at: row.createdAt.toISOString(),
  };
}

const createEventMappingBody = z.object({
  event_key: z.string().min(1).max(200),
});

export async function registerSprint2Routes(app: FastifyInstance) {
  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/domains",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const rows = await db
        .select()
        .from(domains)
        .where(eq(domains.tenantId, req.params.tenantId))
        .orderBy(asc(domains.fqdn));
      return reply.send({
        data: rows.map((r) => ({
          id: r.id,
          tenant_id: r.tenantId,
          fqdn: r.fqdn,
          verification_status: r.verificationStatus,
          verification_error: r.verificationError,
          verified_at: r.verifiedAt ? r.verifiedAt.toISOString() : null,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        })),
      });
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/event-mappings",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = createEventMappingBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const [row] = await db
        .insert(eventMappings)
        .values({
          tenantId: req.params.tenantId,
          eventKey: parsed.data.event_key,
        })
        .returning();
      return reply.status(201).send({
        id: row!.id,
        tenant_id: row!.tenantId,
        event_key: row!.eventKey,
        created_at: row!.createdAt.toISOString(),
      });
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/setup-checklist",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const tid = req.params.tenantId;

      const [dCount] = await db
        .select({ c: count() })
        .from(domains)
        .where(eq(domains.tenantId, tid));
      const [vCount] = await db
        .select({ c: count() })
        .from(domains)
        .where(
          and(
            eq(domains.tenantId, tid),
            eq(domains.verificationStatus, "verified"),
          ),
        );
      const [sCount] = await db
        .select({ c: count() })
        .from(senderIdentities)
        .where(eq(senderIdentities.tenantId, tid));
      const [bRow] = await db
        .select()
        .from(brandingProfiles)
        .where(eq(brandingProfiles.tenantId, tid))
        .limit(1);
      const [pubCount] = await db
        .select({ c: count() })
        .from(emailTemplateVersions)
        .innerJoin(
          emailTemplates,
          eq(emailTemplateVersions.templateId, emailTemplates.id),
        )
        .where(
          and(
            eq(emailTemplates.tenantId, tid),
            eq(emailTemplateVersions.isActive, true),
          ),
        );
      const [mCount] = await db
        .select({ c: count() })
        .from(eventMappings)
        .where(eq(eventMappings.tenantId, tid));

      return reply.send({
        domain_registered: (dCount?.c ?? 0) > 0,
        domain_verified: (vCount?.c ?? 0) > 0,
        sender_created: (sCount?.c ?? 0) > 0,
        branding_configured: !!bRow,
        template_published: (pubCount?.c ?? 0) > 0,
        event_mapped: (mCount?.c ?? 0) > 0,
      });
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/api-keys",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = createApiKeyBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const secret = generateApiKeySecret();
      const prefix = keyPrefixFromSecret(secret);
      const hash = sha256Hex(secret);
      const [row] = await db
        .insert(tenantApiKeys)
        .values({
          tenantId: req.params.tenantId,
          name: parsed.data.name,
          keyPrefix: prefix,
          keyHash: hash,
        })
        .returning();
      return reply.status(201).send({
        id: row!.id,
        name: row!.name,
        key_prefix: row!.keyPrefix,
        secret,
        created_at: row!.createdAt.toISOString(),
      });
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/api-keys",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const rows = await db
        .select({
          id: tenantApiKeys.id,
          name: tenantApiKeys.name,
          key_prefix: tenantApiKeys.keyPrefix,
          revoked_at: tenantApiKeys.revokedAt,
          created_at: tenantApiKeys.createdAt,
        })
        .from(tenantApiKeys)
        .where(eq(tenantApiKeys.tenantId, req.params.tenantId))
        .orderBy(desc(tenantApiKeys.createdAt));
      return reply.send({ data: rows });
    },
  );

  app.delete<{ Params: { tenantId: string; keyId: string } }>(
    "/v1/tenants/:tenantId/api-keys/:keyId",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [row] = await db
        .select()
        .from(tenantApiKeys)
        .where(
          and(
            eq(tenantApiKeys.id, req.params.keyId),
            eq(tenantApiKeys.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!row) return notFound(reply, "API key not found");
      await db
        .update(tenantApiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(tenantApiKeys.id, row.id));
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/senders",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const rows = await db
        .select()
        .from(senderIdentities)
        .where(eq(senderIdentities.tenantId, req.params.tenantId))
        .orderBy(asc(senderIdentities.email));
      return reply.send({ data: rows.map(mapSender) });
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/senders",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = createSenderBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const body = parsed.data;
      const [dom] = await db
        .select()
        .from(domains)
        .where(
          and(
            eq(domains.id, body.domain_id),
            eq(domains.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!dom) return notFound(reply, "Domain not found for tenant");
      if (dom.verificationStatus !== "verified") {
        return badRequest(
          reply,
          "Domain must be verified before creating a sender",
        );
      }
      try {
        const [row] = await db
          .insert(senderIdentities)
          .values({
            tenantId: req.params.tenantId,
            domainId: dom.id,
            email: body.email,
            displayName: body.display_name,
            replyTo: body.reply_to ?? null,
          })
          .returning();
        return reply.status(201).send(mapSender(row!));
      } catch (e) {
        const err = e as { code?: string };
        if (err.code === "23505") {
          return conflict(reply, "Sender email already exists for this tenant");
        }
        throw e;
      }
    },
  );

  app.get<{ Params: { tenantId: string; senderId: string } }>(
    "/v1/tenants/:tenantId/senders/:senderId",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [row] = await db
        .select()
        .from(senderIdentities)
        .where(
          and(
            eq(senderIdentities.id, req.params.senderId),
            eq(senderIdentities.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!row) return notFound(reply, "Sender not found");
      return reply.send(mapSender(row));
    },
  );

  app.patch<{ Params: { tenantId: string; senderId: string } }>(
    "/v1/tenants/:tenantId/senders/:senderId",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const body = z
        .object({
          display_name: z.string().min(1).max(200).optional(),
          reply_to: emailSchema.optional().nullable(),
          state: z.enum(["active", "inactive"]).optional(),
        })
        .safeParse(req.body);
      if (!body.success) {
        return badRequest(reply, "Validation failed", body.error.flatten());
      }
      const [existing] = await db
        .select()
        .from(senderIdentities)
        .where(
          and(
            eq(senderIdentities.id, req.params.senderId),
            eq(senderIdentities.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!existing) return notFound(reply, "Sender not found");
      const u: Partial<typeof senderIdentities.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.data.display_name !== undefined)
        u.displayName = body.data.display_name;
      if (body.data.reply_to !== undefined) u.replyTo = body.data.reply_to;
      if (body.data.state !== undefined) u.state = body.data.state;
      const [row] = await db
        .update(senderIdentities)
        .set(u)
        .where(eq(senderIdentities.id, existing.id))
        .returning();
      return reply.send(mapSender(row!));
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/branding",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = brandingBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const [t] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, req.params.tenantId))
        .limit(1);
      if (!t) return notFound(reply, "Tenant not found");
      const [row] = await db
        .insert(brandingProfiles)
        .values({
          tenantId: req.params.tenantId,
          logoUrl: parsed.data.logo_url,
          primaryColor: parsed.data.color_primario,
        })
        .onConflictDoUpdate({
          target: brandingProfiles.tenantId,
          set: {
            logoUrl: parsed.data.logo_url,
            primaryColor: parsed.data.color_primario,
            updatedAt: new Date(),
          },
        })
        .returning();
      return reply.send({
        tenant_id: row!.tenantId,
        logo_url: row!.logoUrl,
        color_primario: row!.primaryColor,
        updated_at: row!.updatedAt.toISOString(),
      });
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/branding",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [row] = await db
        .select()
        .from(brandingProfiles)
        .where(eq(brandingProfiles.tenantId, req.params.tenantId))
        .limit(1);
      if (!row) return notFound(reply, "Branding not configured");
      return reply.send({
        tenant_id: row.tenantId,
        logo_url: row.logoUrl,
        color_primario: row.primaryColor,
        updated_at: row.updatedAt.toISOString(),
      });
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/templates",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const rows = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.tenantId, req.params.tenantId))
        .orderBy(asc(emailTemplates.name));
      const out = [];
      for (const t of rows) {
        const [active] = await db
          .select()
          .from(emailTemplateVersions)
          .where(
            and(
              eq(emailTemplateVersions.templateId, t.id),
              eq(emailTemplateVersions.isActive, true),
            ),
          )
          .limit(1);
        out.push({
          ...mapTemplate(t),
          active_version_id: active?.id ?? null,
        });
      }
      return reply.send({ data: out });
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/templates",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = createTemplateBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const [row] = await db
        .insert(emailTemplates)
        .values({
          tenantId: req.params.tenantId,
          name: parsed.data.name,
          description: parsed.data.description ?? null,
        })
        .returning();
      return reply.status(201).send(mapTemplate(row!));
    },
  );

  app.post<{ Params: { tenantId: string; templateId: string } }>(
    "/v1/tenants/:tenantId/templates/:templateId/versions",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [tpl] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, req.params.templateId),
            eq(emailTemplates.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!tpl) return notFound(reply, "Template not found");
      const parsed = createVersionBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const [lastVer] = await db
        .select()
        .from(emailTemplateVersions)
        .where(eq(emailTemplateVersions.templateId, tpl.id))
        .orderBy(desc(emailTemplateVersions.version))
        .limit(1);
      const nextVersion = (lastVer?.version ?? 0) + 1;
      const [row] = await db
        .insert(emailTemplateVersions)
        .values({
          templateId: tpl.id,
          bodyHtml: parsed.data.body_html,
          variableNames: JSON.stringify(parsed.data.variable_names),
          isActive: false,
          version: nextVersion,
        })
        .returning();
      return reply.status(201).send(mapVersion(row!));
    },
  );

  app.get<{ Params: { tenantId: string; templateId: string } }>(
    "/v1/tenants/:tenantId/templates/:templateId/versions",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [tpl] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, req.params.templateId),
            eq(emailTemplates.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!tpl) return notFound(reply, "Template not found");
      const rows = await db
        .select()
        .from(emailTemplateVersions)
        .where(eq(emailTemplateVersions.templateId, tpl.id))
        .orderBy(desc(emailTemplateVersions.version));
      return reply.send({ data: rows.map(mapVersion) });
    },
  );

  app.post<{ Params: { tenantId: string; templateId: string } }>(
    "/v1/tenants/:tenantId/templates/:templateId/publish",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = publishBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const [tpl] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, req.params.templateId),
            eq(emailTemplates.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!tpl) return notFound(reply, "Template not found");
      const [ver] = await db
        .select()
        .from(emailTemplateVersions)
        .where(
          and(
            eq(emailTemplateVersions.id, parsed.data.version_id),
            eq(emailTemplateVersions.templateId, tpl.id),
          ),
        )
        .limit(1);
      if (!ver) return notFound(reply, "Version not found");
      await db
        .update(emailTemplateVersions)
        .set({ isActive: false })
        .where(eq(emailTemplateVersions.templateId, tpl.id));
      await db
        .update(emailTemplateVersions)
        .set({ isActive: true })
        .where(eq(emailTemplateVersions.id, ver.id));
      const [published] = await db
        .select()
        .from(emailTemplateVersions)
        .where(eq(emailTemplateVersions.id, ver.id))
        .limit(1);
      return reply.send(mapVersion(published!));
    },
  );

  app.get<{
    Params: { tenantId: string; templateId: string; versionId: string };
    Querystring: { variables?: string };
  }>(
    "/v1/tenants/:tenantId/templates/:templateId/versions/:versionId/preview",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const raw = req.query.variables ?? "{}";
      let vars: Record<string, unknown>;
      try {
        const v = JSON.parse(raw) as unknown;
        if (typeof v !== "object" || v === null || Array.isArray(v)) {
          return badRequest(reply, "variables must be a JSON object");
        }
        vars = v as Record<string, unknown>;
      } catch {
        return badRequest(reply, "variables must be valid JSON");
      }
      const [tpl] = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, req.params.templateId),
            eq(emailTemplates.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!tpl) return notFound(reply, "Template not found");
      const [ver] = await db
        .select()
        .from(emailTemplateVersions)
        .where(
          and(
            eq(emailTemplateVersions.id, req.params.versionId),
            eq(emailTemplateVersions.templateId, tpl.id),
          ),
        )
        .limit(1);
      if (!ver) return notFound(reply, "Version not found");
      const [brand] = await db
        .select()
        .from(brandingProfiles)
        .where(eq(brandingProfiles.tenantId, req.params.tenantId))
        .limit(1);
      try {
        const { html } = renderWithOptionalBranding(
          ver.bodyHtml,
          vars,
          brand
            ? {
                logoUrl: brand.logoUrl,
                primaryColor: brand.primaryColor,
              }
            : null,
        );
        return reply.send({
          template_id: tpl.id,
          version_id: ver.id,
          html,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Render failed";
        return badRequest(reply, msg);
      }
    },
  );
}
