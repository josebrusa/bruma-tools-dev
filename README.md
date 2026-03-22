# bruma-tools-dev

Monorepo MVP layout: `apps/api` (HTTP API), `apps/worker` (BullMQ email send worker), `apps/web` (Vite + React dashboard). Sprint planning: [planning/README.md](planning/README.md).

## Local development

1. Copy `.env.example` to `.env` at the **repository root** (the API loads this file automatically; you can also use `apps/api/.env` to override).
2. `pnpm install`
3. `docker compose up -d postgres redis` (or full stack: `docker compose up --build`)
4. `pnpm --filter @bruma/api run db:migrate` (applies all SQL in `apps/api/drizzle/`) then `pnpm --filter @bruma/api run dev`
5. In another terminal: `pnpm --filter @bruma/web run dev`

API defaults to `http://localhost:3000`, dashboard to `http://localhost:5173`. Set `ADMIN_API_KEY` in `.env` and use it as `X-API-Key` from the web app.

**Dispatch (Sprint 3):** set `REDIS_URL` for `POST /v1/dispatch`. The worker sends via Resend when `RESEND_API_KEY` is set; without it, jobs fail fast with a clear error on the dispatch row.

**Staging host** (Sprint 1 platform): provision separately and point `VITE_API_BASE_URL` / `ALLOWED_ORIGINS` at that environment; see `docs/cicd.md` and `docs/test-strategy.md`.

**Staging-style compose:** `docker-compose.staging.yml` documents ports and required env vars (`STAGING_*`); keep real secrets in a manager, not in git. Rollback notes: [docs/staging-rollback.md](docs/staging-rollback.md).

**Tenant API keys (Sprint 2):** besides `ADMIN_API_KEY`, you can create per-tenant keys via `POST /v1/tenants/:tenantId/api-keys` (returns the secret once). Those keys only allow access to that tenant’s routes.

**Logs & webhooks (Sprint 4):** set `WEBHOOK_SECRET` for `POST /v1/webhooks/provider` (HMAC-SHA256 of the raw JSON body). Tune `API_RATE_LIMIT_MAX`, `API_RATE_LIMIT_MAX_TENANT`, and `API_RATE_LIMIT_WINDOW_MS` as needed. Trace a failed send: [docs/operator-debugging-failed-send.md](docs/operator-debugging-failed-send.md). Draft runbook: [docs/operations-runbook-v1.md](docs/operations-runbook-v1.md).

**OpenAPI (Sprint 5):** with the API running, open `http://localhost:3000/docs` when docs are enabled (default in development; in production set `OPENAPI_DOCS_ENABLED=true` or leave disabled). Spec source: `apps/api/openapi/openapi.yaml`.

**Operators:** see [docs/operator-handover.md](docs/operator-handover.md) and [docs/glossary.md](docs/glossary.md).
