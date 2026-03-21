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
