import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyProviderWebhookSignature } from "./webhook-signature.js";

describe("verifyProviderWebhookSignature", () => {
  const secret = "test-secret";
  const body = Buffer.from('{"a":1}', "utf8");

  it("accepts raw hex digest", () => {
    const hex = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyProviderWebhookSignature(body, hex, secret)).toBe(true);
  });

  it("accepts sha256= prefix", () => {
    const hex = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyProviderWebhookSignature(body, `sha256=${hex}`, secret)).toBe(
      true,
    );
  });

  it("rejects wrong secret", () => {
    const hex = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyProviderWebhookSignature(body, hex, "other")).toBe(false);
  });

  it("rejects tampered body", () => {
    const hex = createHmac("sha256", secret).update(body).digest("hex");
    const tampered = Buffer.from('{"a":2}', "utf8");
    expect(verifyProviderWebhookSignature(tampered, hex, secret)).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyProviderWebhookSignature(body, undefined, secret)).toBe(false);
  });
});
