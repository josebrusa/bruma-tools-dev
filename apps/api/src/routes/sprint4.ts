import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lt, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  deliveryEvents,
  emailDispatches,
  tenants,
} from "../db/schema.js";
import {
  badRequest,
  forbidden,
  notFound,
  serviceUnavailable,
  unauthorized,
} from "../lib/errors.js";
import { nextDispatchStatus } from "../lib/dispatch-status.js";
import { verifyProviderWebhookSignature } from "../lib/webhook-signature.js";
import { config } from "../config.js";

const webhookBodySchema = z.object({
  provider_message_id: z.string().min(1).max(500),
  event: z.enum([
    "delivered",
    "bounced",
    "spam_complaint",
    "failed",
    "sent",
  ]),
  occurred_at: z.string().max(50).optional(),
  recipient: z.string().email().optional(),
});

function parseOccurredAt(raw: string | undefined): Date {
  if (!raw?.trim()) return new Date();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function encodeCursor(occurredAt: Date, id: string): string {
  const payload = JSON.stringify({
    o: occurredAt.toISOString(),
    i: id,
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

function decodeCursor(raw: string): { o: Date; i: string } | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const v = JSON.parse(json) as { o?: string; i?: string };
    if (typeof v.o !== "string" || typeof v.i !== "string") return null;
    const d = new Date(v.o);
    if (Number.isNaN(d.getTime())) return null;
    return { o: d, i: v.i };
  } catch {
    return null;
  }
}

export async function registerSprint4Routes(app: FastifyInstance) {
  app.post("/v1/webhooks/provider", async (req, reply) => {
    if (!config.webhookSecret?.trim()) {
      return serviceUnavailable(
        reply,
        "Webhook receiver is not configured (WEBHOOK_SECRET)",
      );
    }
    const raw =
      req.rawBody instanceof Buffer ? req.rawBody : Buffer.from("", "utf8");
    const sig =
      (typeof req.headers["x-webhook-signature"] === "string"
        ? req.headers["x-webhook-signature"]
        : undefined) ??
      (typeof req.headers["x-bruma-webhook-signature"] === "string"
        ? req.headers["x-bruma-webhook-signature"]
        : undefined);
    if (!verifyProviderWebhookSignature(raw, sig, config.webhookSecret)) {
      return unauthorized(reply, "Invalid webhook signature");
    }

    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8")) as unknown;
    } catch {
      return badRequest(reply, "Body must be valid JSON");
    }

    const parsed = webhookBodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(reply, "Validation failed", parsed.error.flatten());
    }

    const occurredAt = parseOccurredAt(parsed.data.occurred_at);

    const [dispatch] = await db
      .select()
      .from(emailDispatches)
      .where(
        eq(emailDispatches.providerMessageId, parsed.data.provider_message_id),
      )
      .limit(1);
    if (!dispatch) {
      return notFound(reply, "Unknown provider_message_id");
    }

    const [tenantRow] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, dispatch.tenantId))
      .limit(1);
    if (!tenantRow?.isActive) {
      return forbidden(
        reply,
        "Tenant is inactive; webhook not applied",
      );
    }

    await db.transaction(async (tx) => {
      await tx.insert(deliveryEvents).values({
        dispatchId: dispatch.id,
        tenantId: dispatch.tenantId,
        eventType: parsed.data.event,
        occurredAt,
        rawPayload: raw.toString("utf8").slice(0, 16_000),
      });

      const next = nextDispatchStatus(dispatch.status, parsed.data.event);
      const updates: Partial<typeof emailDispatches.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (parsed.data.recipient?.trim()) {
        updates.recipientEmail = parsed.data.recipient.trim();
      }
      if (next) {
        updates.status = next;
      }
      if (next || parsed.data.recipient?.trim()) {
        await tx
          .update(emailDispatches)
          .set(updates)
          .where(eq(emailDispatches.id, dispatch.id));
      }
    });

    return reply.status(204).send();
  });

  app.get<{
    Querystring: {
      tenant_id?: string;
      status?: string;
      from?: string;
      to?: string;
      limit?: string;
      cursor?: string;
    };
  }>("/v1/logs", async (req, reply) => {
    const auth = req.auth;
    if (!auth) {
      return reply.status(403).send({
        error: "forbidden",
        message: "Missing authorization context",
      });
    }

    let filterTenantId: string | undefined;
    if (auth.kind === "tenant") {
      filterTenantId = auth.tenantId;
    } else {
      const tid = req.query.tenant_id?.trim();
      if (!tid) {
        return badRequest(
          reply,
          "tenant_id query parameter is required for admin",
        );
      }
      const tidCheck = z.string().uuid().safeParse(tid);
      if (!tidCheck.success) {
        return badRequest(reply, "tenant_id must be a valid UUID");
      }
      filterTenantId = tidCheck.data;
    }

    const statusFilter = req.query.status?.trim();
    const from = req.query.from?.trim();
    const to = req.query.to?.trim();
    const limitRaw = Number(req.query.limit ?? "50");
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(100, Math.floor(limitRaw))
        : 50;

    const cursorRaw = req.query.cursor?.trim();
    const cursor = cursorRaw ? decodeCursor(cursorRaw) : null;
    if (cursorRaw && !cursor) {
      return badRequest(reply, "Invalid cursor");
    }

    const conditions = [eq(deliveryEvents.tenantId, filterTenantId)];

    if (statusFilter) {
      conditions.push(eq(emailDispatches.status, statusFilter));
    }
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) {
        conditions.push(gte(deliveryEvents.occurredAt, d));
      }
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        conditions.push(lte(deliveryEvents.occurredAt, d));
      }
    }
    if (cursor) {
      conditions.push(
        or(
          lt(deliveryEvents.occurredAt, cursor.o),
          and(
            eq(deliveryEvents.occurredAt, cursor.o),
            lt(deliveryEvents.id, cursor.i),
          ),
        )!,
      );
    }

    const rows = await db
      .select({
        id: deliveryEvents.id,
        occurred_at: deliveryEvents.occurredAt,
        event_type: deliveryEvents.eventType,
        dispatch_id: deliveryEvents.dispatchId,
        tenant_id: deliveryEvents.tenantId,
        dispatch_status: emailDispatches.status,
        recipient_email: emailDispatches.recipientEmail,
        event_key: emailDispatches.eventKey,
        correlation_id: emailDispatches.correlationId,
      })
      .from(deliveryEvents)
      .innerJoin(
        emailDispatches,
        eq(deliveryEvents.dispatchId, emailDispatches.id),
      )
      .where(and(...conditions))
      .orderBy(desc(deliveryEvents.occurredAt), desc(deliveryEvents.id))
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = page[page.length - 1];
    const next_cursor =
      hasMore && last
        ? encodeCursor(last.occurred_at, last.id)
        : null;

    return reply.send({
      data: page.map((r) => ({
        id: r.id,
        occurred_at: r.occurred_at.toISOString(),
        event_name: r.event_type,
        dispatch_id: r.dispatch_id,
        tenant_id: r.tenant_id,
        dispatch_status: r.dispatch_status,
        recipient: r.recipient_email || null,
        event_key: r.event_key ?? null,
        correlation_id: r.correlation_id ?? null,
      })),
      next_cursor,
    });
  });

}
