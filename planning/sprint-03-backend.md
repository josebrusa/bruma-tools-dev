# Sprint 3 — Backend

Scope references: DOC-BE-01 (Backend Core v2), §6 Sprint plan and §7 backlog — Event Router, Dispatch Engine, Resend adapter, BullMQ queue, worker, and first real send in staging.

1. **Implement EventMapping CRUD HTTP API** — Register mappings from event name string to `template_id` and `sender_id` with active flag per DOC-BE-01 §4 Event Router; acceptance: mappings are tenant-scoped and listable.

2. **Implement mapping resolution for dispatch** — Resolve active mapping at dispatch time and return clear errors if event is missing or inactive (DOC-BE-01 §4); acceptance: resolution matches published template and verified sender domain.

3. **Implement Dispatch Engine `POST /v1/dispatch` handler** — Accept `tenant_id`, event, recipient, and variables; validate tenant active, domain verified, and mapping exists (DOC-BE-01 §4 Dispatch Engine); acceptance: invalid cases return documented 4xx codes.

4. **Render email body for dispatch** — Combine template (active version), branding, and variables via Handlebars; acceptance: output matches preview behavior and rejects unsafe or incomplete input per validation rules.

5. **Persist `EmailDispatch` and enqueue send job** — Record row with `queued` state and enqueue work item with idempotent identifiers (DOC-BE-01 §3–4); acceptance: response is `202` with `messageId` / dispatch id within agreed latency budget.

6. **Implement Provider Layer with Resend adapter** — Abstract `send(payload)` with Resend implementation, error mapping, and no secrets in logs (DOC-BE-01 §4 Provider Layer); acceptance: successful call returns provider message id stored on dispatch.

7. **Configure BullMQ (or approved queue) with Redis** — Queues, connection handling, and graceful shutdown for API and worker processes (DOC-BE-01 §7 “Cola + worker”); acceptance: jobs visible in queue under load test on staging.

8. **Implement worker process consuming send jobs** — Dequeue, call provider, update `EmailDispatch` state transitions, implement up to three retries with fixed backoff, move exhausted jobs to DLQ (DOC-BE-01 §4 Worker); acceptance: failed provider calls retry and finalize to `failed` after limits.

9. **Verify end-to-end dispatch in staging** — Run scripted send with real Resend credentials in staging; acceptance: email received by test inbox and dispatch row shows expected progression (DOC-BE-01 §6 Sprint 3 deliverable).

10. **Update OpenAPI for dispatch, mappings, and queue-related errors** — Document request/response for dispatch and event routes including example payloads (DOC-BE-01 §5); acceptance: fragment merges with prior sprint specs.

ClickUp: Sprint 3 · label `backend`
