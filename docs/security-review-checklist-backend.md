# Backend security review checklist (MVP)

Sign-off item for Sprint 5. Backend owner: check each line before production promotion.

| # | Item | Status |
|---|------|--------|
| 1 | **API keys** — Tenant keys stored as SHA-256 only; full secret returned once on create; never logged (logger redacts `X-API-Key`). | |
| 2 | **Admin key** — `ADMIN_API_KEY` only in secret manager / env; rotated for staging/prod. | |
| 3 | **Tenant isolation** — All tenant-scoped routes use `ensureTenantAccess`; path `tenantId` validated as UUID; no cross-tenant reads/writes. | |
| 4 | **Provider credentials** — No `ProviderConfig` / third-party API secrets in MVP schema; when added, use KMS or envelope encryption and never return in JSON. | |
| 5 | **Webhooks** — `POST /v1/webhooks/provider` requires valid HMAC (`X-Webhook-Signature` or `X-Bruma-Webhook-Signature`) over raw body; `WEBHOOK_SECRET` required. | |
| 6 | **CORS** — `ALLOWED_ORIGINS` explicit list; no `*` in production with credentials. | |
| 7 | **OpenAPI / docs** — Swagger UI (`/docs`) disabled in production unless `OPENAPI_DOCS_ENABLED=true` deliberately. | |
| 8 | **Debug** — No debug-only routes shipped in prod build; `NODE_ENV=production` for runtime. | |
| 9 | **Rate limits** — `API_RATE_LIMIT_ENABLED`, `API_RATE_LIMIT_MAX`, `API_RATE_LIMIT_MAX_TENANT`, `API_RATE_LIMIT_WINDOW_MS` reviewed for load (in-memory limiter; scale-out needs shared store later). | |
| 10 | **Timeouts** — `REQUEST_TIMEOUT_MS` appropriate behind reverse proxy. | |

**Reviewer / date:** _______________________
