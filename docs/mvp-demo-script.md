# MVP stakeholder demo script

Repeatable sequence aligned with Sprint 5 planning (tenant → domain → template → event → dispatch → webhook update).

## Prerequisites

- API running with `DATABASE_URL`, migrations applied, `REDIS_URL` for dispatch queue, worker consuming `send` jobs.
- `ADMIN_API_KEY` for dashboard login and admin API calls.
- Optional: `WEBHOOK_SECRET` configured on API and provider simulator to exercise `/v1/webhooks/provider`.

## Steps

1. **Tenant** — Create a tenant (`POST /v1/tenants`) or use an existing slug; note `tenant_id`.
2. **Domain** — `POST /v1/tenants/{tenantId}/domains` with `{ "fqdn": "mail.example.com" }`; copy DNS records from `GET .../dns-records`; when DNS is ready, `POST .../verify`.
3. **Sender** — After domain is verified, `POST /v1/tenants/{tenantId}/senders` with `domain_id`, `email`, `display_name`.
4. **Branding (optional)** — `POST /v1/tenants/{tenantId}/branding` with `logo_url` and `color_primario` (`#RRGGBB`).
5. **Template** — `POST .../templates`, add a version with `POST .../templates/{id}/versions`, then `POST .../publish` with `version_id`.
6. **Event mapping** — `POST /v1/tenants/{tenantId}/event-mappings` with `event_key`, `template_id`, `sender_id`.
7. **Dispatch** — `POST /v1/dispatch` with `tenant_id`, `event`, `recipient`, optional `variables` and `idempotency_key`; capture `message_id` and `provider_message_id` when worker updates the row.
8. **Logs** — `GET /v1/logs?tenant_id={uuid}` (admin) or tenant key without query; confirm delivery events appear.
9. **Webhook (optional)** — `POST /v1/webhooks/provider` with signed body updating status for `provider_message_id`.

## Dashboard path

Use the web app: login with admin key → select tenant → Domains, Senders, Branding, Templates, Events as available in the UI.
