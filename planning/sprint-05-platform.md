# Sprint 5 — Platform (DevOps + QA)

Scope references: DOC-OPS-01 (DevOps v1) §8 backlog (ongoing operations); DOC-QA-01 (QA v1) §5 Sprint 5 — E2E collaboration, bug triage, operator validation, and MVP closure. DevOps weekly plan covers four weeks; this sprint emphasizes release hardening, monitoring, and final QA sign-off alongside Backend/Frontend Sprint 5.

1. **Gate production deploy on green regression** — Require full automated suite plus agreed manual checklist before prod promotion (DOC-QA-01 §2 “Regresión”); acceptance: pipeline or process blocks deploy if checks fail.

2. **Run post-deploy smoke tests in production** — Health endpoints, login, and non-destructive dispatch test in controlled conditions (DOC-OPS-01 §6); acceptance: results logged; rollback if smoke fails.

3. **Validate monitoring and alerts in production** — Confirm dashboards and alert routes work for API errors, queue depth, and worker heartbeat (DOC-OPS-01 §6); acceptance: on-call simulation successful.

4. **Verify backup and restore procedures in production context** — Confirm backup jobs run and restore steps are tested on a non-prod clone if prod restore is not executed live (DOC-OPS-01 §8); acceptance: documentation updated with last drill date.

5. **Complete secrets and TLS review for prod** — Certificate expiry monitoring, HSTS where applicable, and secret rotation owners named (DOC-OPS-01 §3); acceptance: checklist signed.

6. **Support QA full-system E2E and bug bash** — Provide environment stability, log access, and redeploy hotfixes during the sprint (DOC-QA-01 §5 Sprint 5); acceptance: SLA for env incidents defined.

7. **Triage and verify defect fixes across environments** — Ensure fixes promoted staging → prod with traceability (DOC-QA-01 §6); acceptance: release notes list verified fixes.

8. **Facilitate operator trial on production (if approved)** — Controlled access and feature flags for first real usage (DOC-QA-01 §1); acceptance: feedback loop to PO without service disruption.

9. **Publish post-MVP operations handover** — Escalation paths, runbook location, and how to open incidents (DOC-OPS-01 §8); acceptance: team acknowledgment recorded.

10. **MVP platform and QA closure** — Joint sign-off that infra, monitoring, and QA criteria for MVP release are met (DOC-QA-01 §5 Sprint 5 “Demo y aprobación MVP”); acceptance: PO approval for go-live and support model.

ClickUp: Sprint 5 · labels `devops` / `qa`
