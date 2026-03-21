import { describe, expect, it } from "vitest";
import { normalizeFqdn, slugSchema, fqdnSchema } from "./tenant-domain.js";

describe("slugSchema", () => {
  it("accepts valid slugs", () => {
    expect(slugSchema.safeParse("acme-corp").success).toBe(true);
    expect(slugSchema.safeParse("a12").success).toBe(true);
  });
  it("rejects invalid", () => {
    expect(slugSchema.safeParse("ACME").success).toBe(false);
    expect(slugSchema.safeParse("ab").success).toBe(false);
    expect(slugSchema.safeParse("a--b").success).toBe(false);
  });
});

describe("fqdnSchema", () => {
  it("accepts hostnames", () => {
    expect(fqdnSchema.safeParse("mail.example.com").success).toBe(true);
  });
});

describe("normalizeFqdn", () => {
  it("lowercases and strips trailing dot", () => {
    expect(normalizeFqdn(" Example.COM. ")).toBe("example.com");
  });
});
