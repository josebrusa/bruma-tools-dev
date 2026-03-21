# Sprint 3 — Platform (DevOps + QA)

Scope references: DOC-OPS-01 (DevOps v1) §7 Sprint 3 and §8 backlog; DOC-QA-01 (QA v1) §5 Sprint 3 — CD to staging, health checks, centralized logs, E2E dispatch, worker, webhooks, and dashboard UX validation.

1. **Enable automatic deploy to staging on merge to `main`** — Pipeline promotes built images to staging and rolls out services within the agreed time window (DOC-OPS-01 §8 “Deploy CD staging”); acceptance: merge to `main` updates staging in under five minutes or documented SLA.

2. **Configure health checks for API, worker, and frontend containers** — Docker healthcheck or orchestrator probes calling documented endpoints including worker liveness strategy (DOC-OPS-01 §6, §8 “Health checks”); acceptance: unhealthy containers restart per policy.

3. **Set up centralized logs for staging** — Ship JSON logs to Loki, ELK, or chosen stack with `tenant_id` and `request_id` fields where applicable (DOC-OPS-01 §6); acceptance: QA can filter logs for a single dispatch trace.

4. **Add staging dashboard for queue metrics** — At minimum expose pending/failed job counts (Grafana panel or provider metrics) per DOC-OPS-01 §6; acceptance: on-call can see backlog growth.

5. **Document rollback for staging deploys** — One-page steps to revert to previous image tags; acceptance: stored in repo and linked from ClickUp (DOC-OPS-01 §8 runbook alignment).

6. **Automate E2E critical path: tenant setup through dispatch** — Playwright/Cypress flow against staging: configure tenant artifacts → trigger dispatch → assert queued/sent state in UI or API (DOC-QA-01 §2–3); acceptance: runs on schedule or nightly with artifacts retained.

7. **Test worker retries and DLQ behavior** — Simulate provider failure in test harness or staging; assert three retries and final failed state (DOC-QA-01 §3 “Reintento de envío fallido”); acceptance: evidence in test report.

8. **Test or stage webhook handling** — Exercise `POST /v1/webhooks/provider` with valid and invalid signatures when the endpoint is on staging (DOC-QA-01 §3); acceptance: if the endpoint lands late in the sprint, deliver committed fixtures plus a pending CI case that passes once wired, with status noted in the sprint report.

9. **Conduct dashboard UX walkthrough with QA** — Scripted checklist on Templates, Events, and Branding flows for clarity and error copy (DOC-QA-01 §5 Sprint 3 “Validación del Dashboard”); acceptance: issues filed with severity.

10. **Publish Sprint 3 QA summary** — Aggregate E2E status, worker/webhook tests, and open defects with severity (DOC-QA-01 §5 “Informe de bugs encontrados”); acceptance: linked in sprint review.

ClickUp: Sprint 3 · labels `devops` / `qa`
