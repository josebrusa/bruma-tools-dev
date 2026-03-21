import { z } from "zod";

export const slugSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase alphanumeric with single hyphens");

export const fqdnSchema = z
  .string()
  .min(3)
  .max(253)
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "invalid FQDN",
  );

export function normalizeFqdn(fqdn: string): string {
  return fqdn.trim().toLowerCase().replace(/\.$/, "");
}
