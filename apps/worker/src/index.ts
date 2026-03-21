import "dotenv/config";
import { Worker, Queue, UnrecoverableError } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "@bruma/api/db";
import {
  deliveryEvents,
  emailDispatches,
  senderIdentities,
} from "@bruma/api/schema";
import { createResendProvider } from "./provider.js";
import { EMAIL_SEND_DLQ, EMAIL_SEND_QUEUE } from "./constants.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const resendApiKey = process.env.RESEND_API_KEY ?? "";

function logLine(
  msg: string,
  extra?: Record<string, string | null | undefined>,
) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      tenant_id: extra?.tenant_id ?? null,
      request_id: extra?.request_id ?? null,
      msg,
    }),
  );
}

function logError(
  msg: string,
  err: unknown,
  extra?: Record<string, string | null | undefined>,
) {
  const m = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      tenant_id: extra?.tenant_id ?? null,
      request_id: extra?.request_id ?? null,
      msg,
      error: m,
    }),
  );
}

const redisConnection = { url: redisUrl };
const dlq = new Queue(EMAIL_SEND_DLQ, { connection: redisConnection });

const provider = resendApiKey
  ? createResendProvider(resendApiKey)
  : null;

async function processSend(dispatchId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(emailDispatches)
    .where(eq(emailDispatches.id, dispatchId))
    .limit(1);
  if (!row) {
    throw new Error("dispatch not found");
  }
  if (row.status === "sent") {
    return;
  }
  if (row.status === "failed") {
    return;
  }

  const now = new Date();
  await db
    .update(emailDispatches)
    .set({ status: "sending", updatedAt: now })
    .where(eq(emailDispatches.id, dispatchId));

  if (!row.senderId || !row.htmlBody || !row.subject || !row.recipientEmail) {
    const errMsg = "dispatch row missing sender, html, subject, or recipient";
    await db
      .update(emailDispatches)
      .set({
        status: "failed",
        lastError: errMsg,
        updatedAt: new Date(),
      })
      .where(eq(emailDispatches.id, dispatchId));
    throw new UnrecoverableError(errMsg);
  }

  const [sender] = await db
    .select()
    .from(senderIdentities)
    .where(
      and(
        eq(senderIdentities.id, row.senderId),
        eq(senderIdentities.tenantId, row.tenantId),
      ),
    )
    .limit(1);
  if (!sender) {
    const errMsg = "sender not found for dispatch";
    await db
      .update(emailDispatches)
      .set({
        status: "failed",
        lastError: errMsg,
        updatedAt: new Date(),
      })
      .where(eq(emailDispatches.id, dispatchId));
    throw new UnrecoverableError(errMsg);
  }

  if (!provider) {
    const errMsg = "RESEND_API_KEY is not configured";
    await db
      .update(emailDispatches)
      .set({
        status: "failed",
        lastError: errMsg,
        updatedAt: new Date(),
      })
      .where(eq(emailDispatches.id, dispatchId));
    throw new UnrecoverableError(errMsg);
  }

  const from = `${sender.displayName} <${sender.email}>`;
  logLine("sending via provider", {
    tenant_id: row.tenantId,
    request_id: row.correlationId ?? undefined,
  });

  const result = await provider.send({
    from,
    to: row.recipientEmail,
    subject: row.subject,
    html: row.htmlBody,
  });

  if (!result.ok) {
    const errMsg = `${result.code}: ${result.message}`;
    await db
      .update(emailDispatches)
      .set({
        lastError: errMsg,
        updatedAt: new Date(),
      })
      .where(eq(emailDispatches.id, dispatchId));
    throw new Error(errMsg);
  }

  const doneAt = new Date();
  await db
    .update(emailDispatches)
    .set({
      status: "sent",
      providerMessageId: result.providerMessageId,
      lastError: null,
      updatedAt: doneAt,
    })
    .where(eq(emailDispatches.id, dispatchId));

  await db.insert(deliveryEvents).values({
    dispatchId,
    tenantId: row.tenantId,
    eventType: "sent",
    occurredAt: doneAt,
    rawPayload: null,
  });

  logLine("provider accepted send", {
    tenant_id: row.tenantId,
    request_id: row.correlationId ?? undefined,
  });
}

const worker = new Worker<{ dispatchId: string }>(
  EMAIL_SEND_QUEUE,
  async (job) => {
    await processSend(job.data.dispatchId);
  },
  {
    connection: { ...redisConnection },
    concurrency: 5,
  },
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const max = job.opts.attempts ?? 1;
  const terminal =
    err instanceof UnrecoverableError || job.attemptsMade >= max;
  if (!terminal) return;
  const errMsg = err instanceof Error ? err.message : String(err);
  try {
    await db
      .update(emailDispatches)
      .set({
        status: "failed",
        lastError: errMsg,
        updatedAt: new Date(),
      })
      .where(eq(emailDispatches.id, job.data.dispatchId));
    await dlq.add(
      "exhausted",
      {
        dispatchId: job.data.dispatchId,
        error: errMsg,
      },
      { removeOnComplete: 500 },
    );
  } catch (e) {
    logError("failed handler error", e);
  }
});

worker.on("error", (err) => {
  logError("worker error", err);
});

logLine(`worker listening on queue ${EMAIL_SEND_QUEUE}`);

async function shutdown(signal: string) {
  logLine(`shutdown ${signal}`);
  await worker.close();
  await dlq.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
