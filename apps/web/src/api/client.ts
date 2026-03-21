const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function mapStatusToMessage(status: number): string {
  switch (status) {
    case 400:
      return "The request could not be processed. Check the fields and try again.";
    case 401:
      return "Your session is invalid. Sign in again.";
    case 403:
      return "You do not have permission for this action.";
    case 404:
      return "The resource was not found.";
    case 409:
      return "This record already exists or conflicts with another.";
    case 422:
      return "The operation could not be completed. Review the details and try again.";
    case 503:
      return "The service is temporarily unavailable. Try again shortly.";
    default:
      return `Something went wrong (HTTP ${status}).`;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit & { apiKey?: string } = {},
): Promise<Response> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.apiKey) {
    headers.set("X-API-Key", init.apiKey);
  }
  const res = await fetch(url, { ...init, headers });
  return res;
}

export async function parseJsonOrThrow<T>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : mapStatusToMessage(res.status);
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  contact: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listTenants(apiKey: string): Promise<Tenant[]> {
  const res = await apiFetch("/v1/tenants", { apiKey });
  const data = await parseJsonOrThrow<{ data: Tenant[] }>(res);
  return data.data;
}

export async function createTenant(
  apiKey: string,
  payload: { slug: string; name: string; contact?: string; timezone?: string },
): Promise<Tenant> {
  const res = await apiFetch("/v1/tenants", {
    method: "POST",
    apiKey,
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<Tenant>(res);
}

export async function updateTenant(
  apiKey: string,
  id: string,
  payload: Partial<{
    name: string;
    contact: string | null;
    timezone: string | null;
    is_active: boolean;
  }>,
): Promise<Tenant> {
  const res = await apiFetch(`/v1/tenants/${id}`, {
    method: "PATCH",
    apiKey,
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<Tenant>(res);
}

export type DomainRow = {
  id: string;
  tenant_id: string;
  fqdn: string;
  verification_status: string;
  verification_error: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listDomains(
  apiKey: string,
  tenantId: string,
): Promise<DomainRow[]> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/domains`, { apiKey });
  const data = await parseJsonOrThrow<{ data: DomainRow[] }>(res);
  return data.data;
}

export type DnsBundle = {
  spf: { type: string; name: string; value: string; purpose: string };
  dkim: { type: string; name: string; value: string; purpose: string };
  dmarc: { type: string; name: string; value: string; purpose: string };
};

export async function getDnsRecords(
  apiKey: string,
  tenantId: string,
  domainId: string,
): Promise<{ domain_id: string; fqdn: string; records: DnsBundle }> {
  const res = await apiFetch(
    `/v1/tenants/${tenantId}/domains/${domainId}/dns-records`,
    { apiKey },
  );
  return parseJsonOrThrow(res);
}

export async function verifyDomain(
  apiKey: string,
  tenantId: string,
  domainId: string,
): Promise<DomainRow> {
  const res = await apiFetch(
    `/v1/tenants/${tenantId}/domains/${domainId}/verify`,
    { method: "POST", apiKey },
  );
  return parseJsonOrThrow<DomainRow>(res);
}

export async function registerDomain(
  apiKey: string,
  tenantId: string,
  fqdn: string,
): Promise<DomainRow> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/domains`, {
    method: "POST",
    apiKey,
    body: JSON.stringify({ fqdn }),
  });
  return parseJsonOrThrow<DomainRow>(res);
}

export type SenderRow = {
  id: string;
  tenant_id: string;
  domain_id: string;
  email: string;
  display_name: string;
  reply_to: string | null;
  state: string;
  created_at: string;
  updated_at: string;
};

export async function listSenders(
  apiKey: string,
  tenantId: string,
): Promise<SenderRow[]> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/senders`, { apiKey });
  const data = await parseJsonOrThrow<{ data: SenderRow[] }>(res);
  return data.data;
}

export async function createSender(
  apiKey: string,
  tenantId: string,
  payload: {
    domain_id: string;
    email: string;
    display_name: string;
    reply_to?: string | null;
  },
): Promise<SenderRow> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/senders`, {
    method: "POST",
    apiKey,
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<SenderRow>(res);
}

export type Checklist = {
  domain_registered: boolean;
  domain_verified: boolean;
  sender_created: boolean;
  branding_configured: boolean;
  template_published: boolean;
  event_mapped: boolean;
};

export async function getSetupChecklist(
  apiKey: string,
  tenantId: string,
): Promise<Checklist> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/setup-checklist`, {
    apiKey,
  });
  return parseJsonOrThrow<Checklist>(res);
}

export async function upsertBranding(
  apiKey: string,
  tenantId: string,
  payload: { logo_url: string; color_primario: string },
): Promise<{
  tenant_id: string;
  logo_url: string;
  color_primario: string;
  updated_at: string;
}> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/branding`, {
    method: "POST",
    apiKey,
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

export type TemplateRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  active_version_id?: string | null;
};

export async function listTemplates(
  apiKey: string,
  tenantId: string,
): Promise<TemplateRow[]> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/templates`, { apiKey });
  const data = await parseJsonOrThrow<{ data: TemplateRow[] }>(res);
  return data.data;
}

export async function createTemplate(
  apiKey: string,
  tenantId: string,
  payload: { name: string; description?: string },
): Promise<TemplateRow> {
  const res = await apiFetch(`/v1/tenants/${tenantId}/templates`, {
    method: "POST",
    apiKey,
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<TemplateRow>(res);
}

export type TemplateVersionRow = {
  id: string;
  template_id: string;
  body_html: string;
  variable_names: string[];
  is_active: boolean;
  version: number;
  created_at: string;
};

export async function listTemplateVersions(
  apiKey: string,
  tenantId: string,
  templateId: string,
): Promise<TemplateVersionRow[]> {
  const res = await apiFetch(
    `/v1/tenants/${tenantId}/templates/${templateId}/versions`,
    { apiKey },
  );
  const data = await parseJsonOrThrow<{ data: TemplateVersionRow[] }>(res);
  return data.data;
}

export async function createTemplateVersion(
  apiKey: string,
  tenantId: string,
  templateId: string,
  payload: { body_html: string; variable_names: string[] },
): Promise<TemplateVersionRow> {
  const res = await apiFetch(
    `/v1/tenants/${tenantId}/templates/${templateId}/versions`,
    {
      method: "POST",
      apiKey,
      body: JSON.stringify(payload),
    },
  );
  return parseJsonOrThrow<TemplateVersionRow>(res);
}

export async function publishTemplateVersion(
  apiKey: string,
  tenantId: string,
  templateId: string,
  versionId: string,
): Promise<TemplateVersionRow> {
  const res = await apiFetch(
    `/v1/tenants/${tenantId}/templates/${templateId}/publish`,
    {
      method: "POST",
      apiKey,
      body: JSON.stringify({ version_id: versionId }),
    },
  );
  return parseJsonOrThrow<TemplateVersionRow>(res);
}
