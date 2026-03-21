import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { verifyDomainDns } from "./dns-verify.js";
import * as dnsRecords from "./dns-records.js";

vi.mock("node:dns/promises", () => ({
  default: {
    resolveTxt: vi.fn(),
  },
}));

import dns from "node:dns/promises";

const { publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

describe("verifyDomainDns", () => {
  beforeEach(() => {
    vi.mocked(dns.resolveTxt).mockReset();
  });

  it("passes when TXT includes the DKIM public key body", async () => {
    const pemBody = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, "");
    const txt = `v=DKIM1; k=rsa; p=${pemBody}`;
    vi.mocked(dns.resolveTxt).mockResolvedValue([[txt]]);

    const result = await verifyDomainDns({
      fqdn: "example.com",
      dkimSelector: "sel",
      dkimPublicKeyPem: publicKey,
    });
    expect(result).toEqual({ ok: true });
  });

  it("fails when DNS returns nothing useful", async () => {
    vi.mocked(dns.resolveTxt).mockResolvedValue([["v=spf1 -all"]]);
    const result = await verifyDomainDns({
      fqdn: "example.com",
      dkimSelector: "sel",
      dkimPublicKeyPem: publicKey,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("No matching DKIM");
      expect(result.reason).toContain(
        dnsRecords.dkimFingerprint(publicKey).slice(0, 12),
      );
    }
  });
});
