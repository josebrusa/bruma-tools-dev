# Sprint 4 — Backend

Scope references: DOC-BE-01 (Backend Core v2), §6 Sprint plan and §7 backlog — Provider webhook receiver, delivery tracking, rate limiting, and logs API.

1. **Implement `POST /v1/webhooks/provider` receiver** — Parse provider callbacks, validate signature using `WEBHOOK_SECRET` / provider rules before any state change (DOC-BE-01 §4 Delivery Tracking); acceptance: invalid signature returns 401 with no DB updates.

2. **Normalize provider payloads to `DeliveryEvent` rows** — Map delivered, bounced, spam_complaint, and failed events with timestamps and optional raw payload storage (DOC-BE-01 §3); acceptance: each webhook creates consistent event history linked to `dispatch_id`.

3. **Update `EmailDispatch` aggregate state from events** — Transition states in line with delivery timeline and avoid contradictory final states (DOC-BE-01 §4); acceptance: GET dispatch reflects latest provider-ground truth.

4. **Implement rate limiting per API key and per tenant** — Configurable limits with 429 responses and `Retry-After` where applicable (DOC-BE-01 §7 “Rate limiting”); acceptance: burst beyond limit is throttled in integration tests.

5. **Implement `GET /v1/logs` with pagination** — Filter by tenant, status, and date range; ensure queries use indexed columns (DOC-BE-01 §5); acceptance: correct page boundaries and stable sort.

6. **Enforce tenant isolation on logs and dispatch reads** — Every list/detail path validates caller tenant context (DOC-BE-01 + DOC-QA-01 §4); acceptance: cross-tenant IDs never leak data.

7. **Harden logging: no secrets or full API keys in log lines** — Structured logs with safe fields only (DOC-QA-01 §4 A09); acceptance: spot-check staging logs against checklist.

8. **Add request correlation identifiers** — Propagate id from API to worker and webhook processing where feasible for support (DOC-OPS-01 §6); acceptance: single dispatch traceable across components in log backend.

9. **Regression tests for critical QA cases** — Automated coverage for inactive tenant dispatch, unverified domain, unmapped event, rate limit, and webhook bounce (DOC-QA-01 §3); acceptance: CI fails on regression of these behaviors.

10. **Update OpenAPI for webhooks, logs, and rate-limit headers** — Document error models and headers (DOC-BE-01 §5); acceptance: spec matches production behavior on staging.

ClickUp: Sprint 4 · label `backend`
