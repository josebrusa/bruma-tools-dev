# Sprint 5 — Backend

Scope references: DOC-BE-01 (Backend Core v2), §6 Sprint plan and §7 backlog — Security hardening, complete OpenAPI, defect fixes from QA, and MVP demo/sign-off.

1. **Complete OpenAPI specification v1** — All MVP endpoints, schemas, examples, and security schemes documented; serve via Swagger UI or static export (DOC-BE-01 §5–7 “OpenAPI docs”); acceptance: every shipped route appears in spec with accurate examples.

2. **Cross-audit tenant isolation** — Review all handlers and jobs for `tenant_id` enforcement and IDOR fixes from QA findings (DOC-QA-01 §4); acceptance: no open critical/high issues in isolation category.

3. **Validate encryption at rest for provider credentials** — Confirm `ProviderConfig` / credential fields use agreed encryption or KMS pattern (DOC-QA-01 §4 A02); acceptance: keys never appear in logs or API responses.

4. **Harden input validation and sanitization** — Uniform validation on query params and bodies, especially logs filters and webhook payloads (DOC-QA-01 §4 A03); acceptance: fuzz or static analysis issues addressed per triage.

5. **Tune rate limits and timeouts for MVP load** — Align defaults with product expectations and document override knobs (DOC-BE-01 §7); acceptance: staging load test notes attached to release.

6. **Optimize hot paths** — Dispatch enqueue, logs queries, and webhook processing profiled; fix N+1 or missing indexes found (DOC-BE-01 §6); acceptance: no regressions in P95 vs Sprint 4 baselines.

7. **Resolve QA-critical and high defects** — Triage and fix backend-owned bugs blocking MVP (DOC-QA-01 §6 SLA); acceptance: critical cleared; highs either fixed or explicitly deferred with PO sign-off.

8. **Prepare demo script and seed data** — Repeatable sequence for stakeholder demo: tenant → domain → template → event → dispatch → webhook update (Plan Maestro / PO); acceptance: script stored in repo or runbook.

9. **Final security review checklist** — API Key handling, webhook signatures, CORS, and no debug endpoints exposed in prod (DOC-QA-01 §4); acceptance: checklist signed by backend owner.

10. **MVP backend sign-off** — PO and QA acceptance that backend meets DOC-BE-01 MVP scope (DOC-BE-01 §6 Sprint 5); acceptance: recorded approval in ClickUp or sprint review notes.

ClickUp: Sprint 5 · label `backend`
