# Operator guide: tracing a failed send

Internal note for support and on-call (Sprint 4).

## 1. Identify the dispatch

- From the **Logs** screen in the dashboard: filter by time range or dispatch status, open a row to see the **delivery timeline** (queued → sent → delivered, or bounced / failed).
- If you only have an API identifier: call `GET /v1/tenants/{tenantId}/email-dispatches/{dispatchId}` with the tenant API key or admin key; use the `correlation_id` field to align with API and worker JSON logs (`request_id` in worker output).

## 2. Cross-check backend state

- **Dispatch row**: `status`, `last_error`, `provider_message_id` explain whether the worker reached the provider and whether a webhook may still arrive.
- **Tenant / domain**: inactive tenants block dispatch at the API; unverified sender domains block mapping validation (see Events and Domains screens).

## 3. Webhooks

- Provider callbacks hit `POST /v1/webhooks/provider` with HMAC signature headers (`X-Webhook-Signature` or `X-Bruma-Webhook-Signature`). Invalid signatures return **401** with no database changes.
- Unknown `provider_message_id` returns **404**; inactive tenant returns **403** without applying updates.

## 4. Rate limits

- Authenticated API traffic is limited per **API key** and per **tenant** (see `API_RATE_LIMIT_MAX`, `API_RATE_LIMIT_MAX_TENANT`, `API_RATE_LIMIT_WINDOW_MS`). **429** responses include `Retry-After`.

## 5. Escalation

- If logs show repeated provider errors, capture `correlation_id`, dispatch id, and timestamp range before escalating to Backend / DevOps.
