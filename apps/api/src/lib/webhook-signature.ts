import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA256 hex digest of raw body; header may be `hex` or `sha256=<hex>`. */
export function verifyProviderWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!secret || !signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const normalized = signatureHeader
    .trim()
    .toLowerCase()
    .replace(/^sha256=/, "");
  if (!/^[0-9a-f]{64}$/i.test(normalized)) return false;
  try {
    const a = Buffer.from(normalized, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
