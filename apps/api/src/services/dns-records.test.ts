import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildDnsBundle, dkimFingerprint } from "./dns-records.js";

const { publicKey: samplePem } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

describe("buildDnsBundle", () => {
  it("returns stable record shapes", () => {
    const b = buildDnsBundle({
      fqdn: "example.com",
      dkimSelector: "sel1",
      dkimPublicKeyPem: samplePem,
    });
    expect(b.dkim.type).toBe("TXT");
    expect(b.dkim.name).toBe("sel1._domainkey.example.com");
    expect(b.dkim.value).toMatch(/^v=DKIM1; k=rsa; p=/);
    expect(b.spf.value).toContain("v=spf1");
    expect(b.dmarc.name).toBe("_dmarc.example.com");
  });
});

describe("dkimFingerprint", () => {
  it("is deterministic", () => {
    const a = dkimFingerprint(samplePem);
    const b = dkimFingerprint(samplePem);
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });
});
