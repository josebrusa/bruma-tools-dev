export type AuthPrincipal =
  | { kind: "admin" }
  | { kind: "tenant"; tenantId: string };
