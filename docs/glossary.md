# Product glossary (MVP)

| Term | Meaning |
|------|---------|
| **Tenant** | Organization using Bruma; all configuration is scoped by `tenant_id`. |
| **Admin API key** | Shared secret (`ADMIN_API_KEY`) with full access; used for dashboard login in MVP. |
| **Tenant API key** | Per-tenant key (`brk_…`); only that tenant’s routes are allowed. |
| **Domain** | Sending domain; must pass DNS verification before senders. |
| **Sender** | From-address identity tied to a verified domain. |
| **Template / version** | Email HTML (Handlebars); one **published** (active) version per template. |
| **Event mapping** | Maps an `event_key` to template + sender for dispatch. |
| **Dispatch** | Queued send job created via `POST /v1/dispatch`. |
| **Delivery event / logs** | Rows from provider webhooks and pipeline; visible under **Logs** / `GET /v1/logs`. |
