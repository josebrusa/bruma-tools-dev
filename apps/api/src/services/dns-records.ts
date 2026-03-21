import { createHash } from "node:crypto";

export type DnsRecord = {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
  purpose: string;
};

export type DnsBundle = {
  spf: DnsRecord;
  dkim: DnsRecord;
  dmarc: DnsRecord;
};

/**
 * Build stable DNS guidance for operators. SPF/DMARC are templates; DKIM uses stored public key material.
 */
export function buildDnsBundle(params: {
  fqdn: string;
  dkimSelector: string;
  dkimPublicKeyPem: string;
}): DnsBundle {
  const { fqdn, dkimSelector, dkimPublicKeyPem } = params;
  const dkimP = pemToDkimPValue(dkimPublicKeyPem);
  const dkimName = `${dkimSelector}._domainkey.${fqdn}`;
  const dkimValue = `v=DKIM1; k=rsa; p=${dkimP}`;

  return {
    spf: {
      type: "TXT",
      name: fqdn,
      value: "v=spf1 include:resend.com ~all",
      purpose: "Authorize Resend (replace with your provider if different)",
    },
    dkim: {
      type: "TXT",
      name: dkimName,
      value: dkimValue,
      purpose: "DKIM signing for outbound mail",
    },
    dmarc: {
      type: "TXT",
      name: `_dmarc.${fqdn}`,
      value: "v=DMARC1; p=none; rua=mailto:postmaster@" + fqdn,
      purpose: "DMARC policy (start with p=none for monitoring)",
    },
  };
}

function pemToDkimPValue(pem: string): string {
  const body = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  return body;
}

export function dkimFingerprint(pem: string): string {
  const der = Buffer.from(
    pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, ""),
    "base64",
  );
  return createHash("sha256").update(der).digest("hex");
}
