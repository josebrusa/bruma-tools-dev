import dns from "node:dns/promises";
import { dkimFingerprint } from "./dns-records.js";

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Best-effort DNS verification: DKIM TXT at selector._domainkey.domain must include our public key fingerprint
 * or the raw p= segment derived from PEM.
 */
export async function verifyDomainDns(params: {
  fqdn: string;
  dkimSelector: string;
  dkimPublicKeyPem: string;
}): Promise<VerifyResult> {
  const { fqdn, dkimSelector, dkimPublicKeyPem } = params;
  const name = `${dkimSelector}._domainkey.${fqdn}`;

  let records: string[][];
  try {
    records = await dns.resolveTxt(name);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    return {
      ok: false,
      reason: `DNS lookup failed for ${name}: ${err.code ?? err.message}`,
    };
  }

  const flat = records.map((chunks) => chunks.join("")).map((s) => s.trim());
  const fp = dkimFingerprint(dkimPublicKeyPem);
  const pemBody = dkimPublicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  for (const txt of flat) {
    if (!txt.toLowerCase().includes("v=dkim1")) continue;
    if (txt.includes(pemBody)) return { ok: true };
    // Some providers normalize p=; accept if any TXT contains a long base64 p= that matches length
    const pMatch = /p=([A-Za-z0-9+/=]+)/.exec(txt);
    if (pMatch && pMatch[1] === pemBody) return { ok: true };
  }

  return {
    ok: false,
    reason: `No matching DKIM TXT at ${name} (expected fingerprint ${fp.slice(0, 12)}…)`,
  };
}
