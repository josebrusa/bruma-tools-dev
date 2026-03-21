# Sprint 2 — Platform (DevOps + QA)

Scope references: DOC-OPS-01 (DevOps v1) §7 Sprint 2 and §8 backlog; DOC-QA-01 (QA v1) §5 Sprint 2 — CI pipeline, registry, secrets, integration tests, and security-focused cases.

1. **Author baseline CI pipeline per service** — GitHub Actions (or equivalent) on PR: lint, unit tests, build for `api`, `worker`, and `frontend` per DOC-OPS-01 §4; acceptance: PR cannot merge if lint or tests fail.

2. **Configure private container registry** — Push images from CI to GHCR, ECR, or approved registry with least-privilege credentials (DOC-OPS-01 §8 “Registry privado”); acceptance: tagged images appear after green main/PR workflow.

3. **Manage staging secrets outside the repo** — Wire `DATABASE_URL`, `REDIS_URL`, provider keys, `WEBHOOK_SECRET`, and API secrets via secret store or CI secrets; acceptance: no secret values in git or image layers (DOC-OPS-01 §3).

4. **Add `docker-compose` overlay or file for staging parity** — Staging-like compose or documented stack matching prod behavior for integration runs (DOC-OPS-01 §8 “docker-compose staging”); acceptance: QA can run integration suite against documented target.

5. **Document CI/CD branch rules** — Which events trigger lint/test/build, when images push, and who approves promotions; acceptance: link stored in repo or ClickUp (DOC-OPS-01 §4).

6. **Expand integration tests: API to database** — Cover CRUD paths for tenants, domains, senders, and templates against a real Postgres (test container or staging) per DOC-QA-01 §2; acceptance: suite runs in CI or scheduled job with clear pass/fail.

7. **Add security test cases for tenant isolation and auth** — Automated or scripted checks that cross-tenant IDs return 404/403 and invalid API keys get 401 (DOC-QA-01 §3–4); acceptance: cases documented and executed at least in staging.

8. **Add unit/integration coverage for Template Engine** — Tests for Handlebars render, missing variables, and publish/active-version behavior (DOC-QA-01 §2); acceptance: failures block merge if wired to required check.

9. **Produce Sprint 2 test report** — Short written summary: integration and security cases run, defects opened, coverage vs target (DOC-QA-01 §5 Sprint 2 “Informe de pruebas de integración”); acceptance: linked from sprint review.

10. **Verify registry and CI credentials rotation path** — Document how to rotate registry and CI tokens without downtime; acceptance: runbook snippet in repo wiki or `planning/` reference (DOC-OPS-01 §3).

ClickUp: Sprint 2 · labels `devops` / `qa`
