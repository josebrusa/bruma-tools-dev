import { Queue } from "bullmq";
import { config } from "../config.js";

export const EMAIL_SEND_QUEUE = "email-send";
export const EMAIL_SEND_DLQ = "email-send-dlq";

let sendQueue: Queue | null = null;

export function getEmailSendQueue(): Queue {
  if (!config.redisUrl?.trim()) {
    throw new Error("REDIS_URL is not configured");
  }
  if (!sendQueue) {
    sendQueue = new Queue(EMAIL_SEND_QUEUE, {
      connection: { url: config.redisUrl },
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return sendQueue;
}

export async function closeQueues(): Promise<void> {
  await sendQueue?.close();
  sendQueue = null;
}
