import type { FastifyInstance } from "fastify";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db/index.js";
import {
  brandingProfiles,
  deliveryEvents,
  domains,
  emailDispatches,
  emailTemplateVersions,
  emailTemplates,
  eventMappings,
  senderIdentities,
  tenants,
} from "../db/schema.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  serviceUnavailable,
  unprocessableEntity,
} from "../lib/errors.js";
import { getEmailSendQueue } from "../lib/queue.js";
import { ensureTenantAccess } from "../lib/tenant-access.js";
import { renderWithOptionalBranding } from "../services/template-render.js";

const emailSchema = z.string().email();

const createMappingBody = z.object({
  event_key: z.string().min(1).max(200),
  template_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  is_active: z.boolean().optional().default(true),
});

const patchMappingBody = z
  .object({
    event_key: z.string().min(1).max(200).optional(),
    template_id: z.string().uuid().optional(),
    sender_id: z.string().uuid().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty patch" });

const dispatchBody = z.object({
  tenant_id: z.string().uuid(),
  event: z.string().min(1).max(200),
  recipient: z.object({ email: emailSchema }),
  variables: z.record(z.string(), z.unknown()).default({}),
  idempotency_key: z.string().min(1).max(200).optional(),
});

async function assertMappingRefsValid(
  tenantId: string,
  templateId: string,
  senderId: string,
): Promise<
  | {
      ok: true;
      template: typeof emailTemplates.$inferSelect;
      activeVersion: typeof emailTemplateVersions.$inferSelect;
      sender: typeof senderIdentities.$inferSelect;
      domain: typeof domains.$inferSelect;
    }
  | { ok: false; reply: (r: import("fastify").FastifyReply) => unknown }
> {
  const [tpl] = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (!tpl) {
    return {
      ok: false,
      reply: (reply) => notFound(reply, "Template not found for tenant"),
    };
  }
  const [ver] = await db
    .select()
    .from(emailTemplateVersions)
    .where(
      and(
        eq(emailTemplateVersions.templateId, tpl.id),
        eq(emailTemplateVersions.isActive, true),
      ),
    )
    .limit(1);
  if (!ver) {
    return {
      ok: false,
      reply: (reply) =>
        unprocessableEntity(
          reply,
          "Template has no published (active) version",
        ),
    };
  }
  const [sender] = await db
    .select()
    .from(senderIdentities)
    .where(
      and(
        eq(senderIdentities.id, senderId),
        eq(senderIdentities.tenantId, tenantId),
      ),
    )
    .limit(1);
  if (!sender) {
    return {
      ok: false,
      reply: (reply) => notFound(reply, "Sender not found for tenant"),
    };
  }
  const [dom] = await db
    .select()
    .from(domains)
    .where(
      and(eq(domains.id, sender.domainId), eq(domains.tenantId, tenantId)),
    )
    .limit(1);
  if (!dom) {
    return {
      ok: false,
      reply: (reply) => notFound(reply, "Sender domain not found"),
    };
  }
  if (dom.verificationStatus !== "verified") {
    return {
      ok: false,
      reply: (reply) =>
        unprocessableEntity(
          reply,
          "Sender domain must be verified before use in dispatch",
        ),
    };
  }
  return { ok: true, template: tpl, activeVersion: ver, sender, domain: dom };
}

function mapDispatch(row: typeof emailDispatches.$inferSelect) {
  return {
    id: row.id,
    tenant_id: row.tenantId,
    status: row.status,
    event_key: row.eventKey,
    recipient_email: row.recipientEmail,
    template_version_id: row.templateVersionId,
    sender_id: row.senderId,
    subject: row.subject,
    provider_message_id: row.providerMessageId,
    correlation_id: row.correlationId,
    last_error: row.lastError,
    idempotency_key: row.idempotencyKey,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function registerSprint3Routes(app: FastifyInstance) {
  app.get<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/event-mappings",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const rows = await db
        .select({
          mapping: eventMappings,
          tpl: emailTemplates,
          activeVer: emailTemplateVersions,
        })
        .from(eventMappings)
        .leftJoin(
          emailTemplates,
          eq(eventMappings.templateId, emailTemplates.id),
        )
        .leftJoin(
          emailTemplateVersions,
          and(
            eq(emailTemplateVersions.templateId, emailTemplates.id),
            eq(emailTemplateVersions.isActive, true),
          ),
        )
        .where(eq(eventMappings.tenantId, req.params.tenantId))
        .orderBy(asc(eventMappings.eventKey));

      return reply.send({
        data: rows.map(({ mapping, tpl, activeVer }) => ({
          id: mapping.id,
          tenant_id: mapping.tenantId,
          event_key: mapping.eventKey,
          template_id: mapping.templateId,
          sender_id: mapping.senderId,
          is_active: mapping.isActive,
          template_published: !!activeVer,
          created_at: mapping.createdAt.toISOString(),
          updated_at: mapping.updatedAt.toISOString(),
          template_name: tpl?.name ?? null,
        })),
      });
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    "/v1/tenants/:tenantId/event-mappings",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const parsed = createMappingBody.safeParse(req.body);
      if (!parsed.success) {
        return badRequest(reply, "Validation failed", parsed.error.flatten());
      }
      const refs = await assertMappingRefsValid(
        req.params.tenantId,
        parsed.data.template_id,
        parsed.data.sender_id,
      );
      if (!refs.ok) return refs.reply(reply);
      try {
        const [row] = await db
          .insert(eventMappings)
          .values({
            tenantId: req.params.tenantId,
            eventKey: parsed.data.event_key,
            templateId: parsed.data.template_id,
            senderId: parsed.data.sender_id,
            isActive: parsed.data.is_active,
            updatedAt: new Date(),
          })
          .returning();
        return reply.status(201).send({
          id: row!.id,
          tenant_id: row!.tenantId,
          event_key: row!.eventKey,
          template_id: row!.templateId,
          sender_id: row!.senderId,
          is_active: row!.isActive,
          template_published: true,
          created_at: row!.createdAt.toISOString(),
          updated_at: row!.updatedAt.toISOString(),
        });
      } catch (e) {
        const err = e as { code?: string };
        if (err.code === "23505") {
          return conflict(
            reply,
            "An event mapping for this key already exists for the tenant",
          );
        }
        throw e;
      }
    },
  );

  app.patch<{
    Params: { tenantId: string; mappingId: string };
  }>("/v1/tenants/:tenantId/event-mappings/:mappingId", async (req, reply) => {
    if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
    const parsed = patchMappingBody.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(reply, "Validation failed", parsed.error.flatten());
    }
    const [existing] = await db
      .select()
      .from(eventMappings)
      .where(
        and(
          eq(eventMappings.id, req.params.mappingId),
          eq(eventMappings.tenantId, req.params.tenantId),
        ),
      )
      .limit(1);
    if (!existing) return notFound(reply, "Event mapping not found");

    const templateId = parsed.data.template_id ?? existing.templateId;
    const senderId = parsed.data.sender_id ?? existing.senderId;
    if (!templateId || !senderId) {
      return unprocessableEntity(
        reply,
        "template_id and sender_id must be set on the mapping",
      );
    }
    const refs = await assertMappingRefsValid(
      req.params.tenantId,
      templateId,
      senderId,
    );
    if (!refs.ok) return refs.reply(reply);

    const next: Partial<typeof eventMappings.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.event_key !== undefined) next.eventKey = parsed.data.event_key;
    if (parsed.data.template_id !== undefined) next.templateId = parsed.data.template_id;
    if (parsed.data.sender_id !== undefined) next.senderId = parsed.data.sender_id;
    if (parsed.data.is_active !== undefined) next.isActive = parsed.data.is_active;

    try {
      const [row] = await db
        .update(eventMappings)
        .set(next)
        .where(eq(eventMappings.id, existing.id))
        .returning();
      return reply.send({
        id: row!.id,
        tenant_id: row!.tenantId,
        event_key: row!.eventKey,
        template_id: row!.templateId,
        sender_id: row!.senderId,
        is_active: row!.isActive,
        created_at: row!.createdAt.toISOString(),
        updated_at: row!.updatedAt.toISOString(),
      });
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "23505") {
        return conflict(
          reply,
          "An event mapping for this key already exists for the tenant",
        );
      }
      throw e;
    }
  });

  app.delete<{
    Params: { tenantId: string; mappingId: string };
  }>("/v1/tenants/:tenantId/event-mappings/:mappingId", async (req, reply) => {
    if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
    const [existing] = await db
      .select()
      .from(eventMappings)
      .where(
        and(
          eq(eventMappings.id, req.params.mappingId),
          eq(eventMappings.tenantId, req.params.tenantId),
        ),
      )
      .limit(1);
    if (!existing) return notFound(reply, "Event mapping not found");
    await db.delete(eventMappings).where(eq(eventMappings.id, existing.id));
    return reply.status(204).send();
  });

  app.get<{
    Params: { tenantId: string; dispatchId: string };
  }>(
    "/v1/tenants/:tenantId/email-dispatches/:dispatchId",
    async (req, reply) => {
      if (!ensureTenantAccess(req, reply, req.params.tenantId)) return;
      const [row] = await db
        .select()
        .from(emailDispatches)
        .where(
          and(
            eq(emailDispatches.id, req.params.dispatchId),
            eq(emailDispatches.tenantId, req.params.tenantId),
          ),
        )
        .limit(1);
      if (!row) return notFound(reply, "Dispatch not found");
      const events = await db
        .select()
        .from(deliveryEvents)
        .where(eq(deliveryEvents.dispatchId, row.id))
        .orderBy(asc(deliveryEvents.occurredAt), asc(deliveryEvents.id));
      return reply.send({
        ...mapDispatch(row),
        events: events.map((e) => ({
          id: e.id,
          event_type: e.eventType,
          occurred_at: e.occurredAt.toISOString(),
        })),
      });
    },
  );

  app.post("/v1/dispatch", async (req, reply) => {
    const auth = req.auth;
    if (!auth) return forbidden(reply, "Missing authorization context");

    const parsed = dispatchBody.safeParse(req.body);
    if (!parsed.success) {
      return badRequest(reply, "Validation failed", parsed.error.flatten());
    }
    const { tenant_id, event, recipient, variables, idempotency_key } =
      parsed.data;

    if (!ensureTenantAccess(req, reply, tenant_id)) return;

    if (!config.redisUrl?.trim()) {
      return serviceUnavailable(
        reply,
        "Dispatch queue is not configured (REDIS_URL)",
      );
    }

    const [tenantRow] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant_id))
      .limit(1);
    if (!tenantRow) return notFound(reply, "Tenant not found");
    if (!tenantRow.isActive) {
      return forbidden(reply, "Tenant is inactive; dispatch is blocked");
    }

    if (idempotency_key) {
      const [existingDispatch] = await db
        .select()
        .from(emailDispatches)
        .where(
          and(
            eq(emailDispatches.tenantId, tenant_id),
            eq(emailDispatches.idempotencyKey, idempotency_key),
          ),
        )
        .limit(1);
      if (existingDispatch) {
        return reply.status(202).send({
          message_id: existingDispatch.id,
          status: existingDispatch.status,
          idempotent: true,
        });
      }
    }

    const [mapping] = await db
      .select()
      .from(eventMappings)
      .where(
        and(
          eq(eventMappings.tenantId, tenant_id),
          eq(eventMappings.eventKey, event),
          eq(eventMappings.isActive, true),
        ),
      )
      .limit(1);

    if (!mapping) {
      return notFound(reply, "No active event mapping for this event");
    }
    if (!mapping.templateId || !mapping.senderId) {
      return unprocessableEntity(
        reply,
        "Event mapping is incomplete (template or sender missing)",
      );
    }

    const refs = await assertMappingRefsValid(
      tenant_id,
      mapping.templateId,
      mapping.senderId,
    );
    if (!refs.ok) return refs.reply(reply);

    const [brand] = await db
      .select()
      .from(brandingProfiles)
      .where(eq(brandingProfiles.tenantId, tenant_id))
      .limit(1);

    let html: string;
    try {
      const rendered = renderWithOptionalBranding(
        refs.activeVersion.bodyHtml,
        variables,
        brand
          ? { logoUrl: brand.logoUrl, primaryColor: brand.primaryColor }
          : null,
      );
      html = rendered.html;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Render failed";
      return badRequest(reply, msg);
    }

    const subject = refs.template.name || "Notification";

    let dispatchRow: typeof emailDispatches.$inferSelect;
    try {
      const [inserted] = await db
        .insert(emailDispatches)
        .values({
          tenantId: tenant_id,
          status: "queued",
          eventKey: event,
          recipientEmail: recipient.email,
          templateVersionId: refs.activeVersion.id,
          senderId: mapping.senderId,
          subject,
          htmlBody: html,
          idempotencyKey: idempotency_key ?? null,
          correlationId: req.correlationId?.trim() || null,
          updatedAt: new Date(),
        })
        .returning();
      dispatchRow = inserted!;
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "23505" && idempotency_key) {
        const [existingDispatch] = await db
          .select()
          .from(emailDispatches)
          .where(
            and(
              eq(emailDispatches.tenantId, tenant_id),
              eq(emailDispatches.idempotencyKey, idempotency_key),
            ),
          )
          .limit(1);
        if (existingDispatch) {
          return reply.status(202).send({
            message_id: existingDispatch.id,
            status: existingDispatch.status,
            idempotent: true,
          });
        }
      }
      throw e;
    }

    const queue = getEmailSendQueue();
    await queue.add(
      "send",
      { dispatchId: dispatchRow.id },
      { jobId: dispatchRow.id },
    );

    return reply.status(202).send({
      message_id: dispatchRow.id,
      status: dispatchRow.status,
    });
  });
}
