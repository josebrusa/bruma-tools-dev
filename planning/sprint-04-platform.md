# Sprint 4 — Platform (DevOps + QA)

Scope references: DOC-OPS-01 (DevOps v1) §7 Sprint 4 and §8 backlog; DOC-QA-01 (QA v1) §5 Sprint 4 — Production environment, manual prod pipeline, alerts, backups, full regression, OWASP-oriented checks, and release approval.

1. **Provision production environment** — Infrastructure equivalent to staging with TLS, network restrictions, and access control per DOC-OPS-01 §5; acceptance: production checklist completed and stored.

2. **Configure manual production deployment pipeline** — Approval gate, tagged releases, and rollback using same images as staging (DOC-OPS-01 §4); acceptance: dry-run deploy to prod with non-customer data or feature-flagged path.

3. **Implement alerting for error rate, queue depth, and worker health** — Notifications within two minutes of threshold breach (DOC-OPS-01 §6); acceptance: test alerts fire in a controlled drill.

4. **Enable automated PostgreSQL backups with retention** — Daily backup with 30-day retention and encrypted storage (DOC-OPS-01 §8 “Backup DB”); acceptance: restore drill performed on staging from a backup artifact.

5. **Publish operations runbook v1** — Deploy, rollback, common incidents, and who to page (DOC-OPS-01 §8 “Runbook”); acceptance: reviewed by Backend and QA leads.

6. **Execute full MVP regression suite** — Automated integration + E2E + manual exploratory pass across modules (DOC-QA-01 §5 Sprint 4); acceptance: release candidate status recorded with defect list.

7. **Run OWASP-oriented security checks** — Focus on access control, injection in log filters, misconfiguration, and logging of sensitive data (DOC-QA-01 §4); acceptance: findings triaged with severities and owners.

8. **Validate acceptance criteria per module with QA** — Crosswalk DOC-FE-01 / DOC-BE-01 acceptance tables to test results (DOC-QA-01 §5); acceptance: sign-off sheet or ticket list completed.

9. **Production readiness gate** — No open critical defects, secrets rotated for prod, monitoring green for 24h on staging soak (DOC-QA-01 §1); acceptance: PO/DevOps approval recorded.

10. **Finalize release and deploy approval package** — Changelog, known issues, and rollback steps for first production release (DOC-QA-01 §5 “Aprobación de deploy a producción”); acceptance: package linked in ClickUp for go-live decision.

ClickUp: Sprint 4 · labels `devops` / `qa`
