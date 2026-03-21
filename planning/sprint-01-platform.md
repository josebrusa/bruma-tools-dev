# Sprint 1 — Platform (DevOps + QA)

Scope references: DOC-OPS-01 (DevOps v1) §7 Sprint 1 and §8 backlog; DOC-QA-01 (QA v1) §5 Sprint 1 — local/staging foundations, containers, and first test assets for Tenant/Domain.

1. **Author Docker Compose for local development** — `docker-compose.yml` (or equivalent) defining `api`, `worker`, `frontend`, `postgres`, and `redis` with documented ports and dependencies per DOC-OPS-01 §2; acceptance: a new developer brings the stack up in under 10 minutes following README steps (DOC-OPS-01 §8 “docker-compose dev”).

2. **Add production-oriented Dockerfiles** — Separate optimized Dockerfiles for API, worker, and frontend services on `node:20-alpine` (or approved base), no secrets baked into layers; acceptance: image sizes stay within the project target (e.g. under 200MB) and build args only for non-secret configuration (DOC-OPS-01 §8 “Dockerfiles”).

3. **Provision staging environment** — Host or cluster where staging runs, networking, TLS as required, and team access; acceptance: URL(s) shared with Backend/Frontend/QA and reachable from corporate network/VPN (DOC-OPS-01 §7 Sprint 1 “Staging accesible para todo el equipo”).

4. **Configure repositories and access** — GitHub org/repos created or linked, branch protection on `main`, team permissions documented; acceptance: required reviewers and CI checks enforced before merge (DOC-OPS-01 Sprint 1 + `00-initial-config` alignment).

5. **Inject non-secret configuration for staging** — Staging-specific `ALLOWED_ORIGINS`, `DATABASE_URL`/`REDIS_URL` placeholders in secret store, `VITE_API_BASE_URL` for the dashboard build; acceptance: services start with secrets supplied via environment or secret manager, none in git (DOC-OPS-01 §3).

6. **Publish test strategy document v1** — Written pyramid (unit / integration / E2E), tooling choices, coverage target ≥70% for new code, and entry criteria for staging; acceptance: DOC-QA-01 §2 referenced and stored in repo or wiki link in ClickUp (DOC-QA-01 Sprint 1 “Plan de pruebas v1”).

7. **Add unit tests for Tenant domain logic** — Tests covering slug validation, activation rules, and isolation assumptions for the Tenant module; acceptance: suite runs in CI and fails on regression (DOC-QA-01 Sprint 1 “Suite unitaria de Tenant y Domain” — Tenant portion).

8. **Add unit tests for Domain + DNS helper logic** — Tests for DNS record generation shape and verification state transitions (with mocks where DNS is external); acceptance: same CI job as above, meaningful assertions on edge cases (DOC-QA-01 Sprint 1 — Domain portion).

9. **Set up E2E test harness** — Install Playwright, Cypress, or chosen runner, base config pointing at staging or local compose, and one smoke test (e.g. health or login page load); acceptance: `npm run test:e2e` (or equivalent) runs locally and in CI stub job if applicable (DOC-QA-01 Sprint 1 “Setup de framework de testing E2E”).

10. **Define bug reporting template and severity SLA** — ClickUp/issue template matching DOC-QA-01 §6 (title, severity, steps, expected vs actual, environment, evidence); acceptance: template linked from Sprint 1 description and team trained on usage (DOC-QA-01 §6).

ClickUp: Sprint 1 · labels `devops` / `qa`
