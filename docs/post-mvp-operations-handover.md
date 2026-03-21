# Post-MVP operations handover

Sprint 5 platform closure: escalation, runbooks, and incidents.

## Runbooks and code

- **Demo / API flow:** [mvp-demo-script.md](mvp-demo-script.md)
- **CI:** `.github/workflows/ci.yml` — required green before merge to `main`.
- **Production gate (manual):** `.github/workflows/production-gate.yml` — run before promoting to production after QA sign-off.
- **Staging compose:** `docker-compose.staging.yml` at repository root.

## Escalation

1. **Application / API** — On-call engineer; check API logs, DB connectivity, Redis, worker process.
2. **Infra / DNS / TLS** — Platform owner per organization chart.
3. **Security / secrets** — Rotate `ADMIN_API_KEY`, `WEBHOOK_SECRET`, tenant keys via revoke + re-issue.

## Incidents

- Capture timeline, `X-Request-Id`, affected `tenant_id` (if applicable), and remediation.
- Post-incident: update runbooks or checklists as needed.

## Acknowledgment

Team acknowledgment of this handover: _______________________
