# Initial configuration (Setup / Sprint 0)

Scope references: Plan Maestro v2, DevOps v1 (environment and secrets), Backend v2 (OpenAPI contract). Do not store secrets in ClickUp or in this repo beyond `.env.example`.

1. **Decide and document repository strategy** — Choose monorepo (e.g. `apps/api`, `apps/worker`, `apps/web`) versus multiple repositories for the MVP; record the decision in one line in the root `README.md` or in `planning/README.md` so onboarding and CI layout are unambiguous.

2. **Create GitHub organization or project and repositories** — Provision the org/project and repo(s) per the chosen strategy; enable branch protection on `main` (required reviews, required status checks / CI green before merge).

3. **Connect ClickUp and GitHub** — Link the product repo(s) to ClickUp; agree sync rules (e.g. PRs/commits, task IDs in PR titles or descriptions) and explicitly exclude internal documentation binaries from automated attachments.

4. **Set up the ClickUp product space** — Create lists or folders `Sprint 1` … `Sprint 5` plus a `Setup` (or Sprint 0) list; create labels `backend`, `frontend`, `devops`, and `qa` for filtering and reporting.

5. **Provision Resend for the MVP** — Create the Resend account and project; document who owns API keys and where they live (secret manager, GitHub Secrets, etc.) — **not** in ClickUp or plain text in tickets.

6. **Define environment names and branch policy** — Standardize names `dev`, `staging`, and `prod`; write the rule for promotions (e.g. `main` → staging; tag or approval → prod) and align it with DevOps v1.

7. **Add a root `.env.example` (no secrets)** — Check in a template listing non-secret variable names aligned with DevOps v1, including at minimum: `DATABASE_URL`, `REDIS_URL`, `WEBHOOK_SECRET`, provider keys as placeholders, `ALLOWED_ORIGINS`, and `VITE_API_BASE_URL` (or equivalent for the web app).

8. **Treat OpenAPI as the API contract** — Agree that the OpenAPI spec lives in the repository and stays the single source of truth; create or link a blocking ClickUp task “OpenAPI week 2” (per Plan Maestro v2) so consumers and implementers share one contract.

9. **Define PM/PO governance** — Publish a written rule: no Phase 2 or Phase 3 features without a formal change order; name who approves sprint closure and scope changes.

10. **Run the initial ClickUp import** — Import these 10 tasks and, when available, the tasks from `sprint-01-*.md`; verify each task has exactly one owner or owning team and no duplicate orphan items.

ClickUp: Setup (or Sprint 0)
