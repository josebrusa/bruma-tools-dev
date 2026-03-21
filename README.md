# bruma-tools-dev

Monorepo MVP layout: `apps/api` (HTTP API), `apps/worker` (queue consumer placeholder), `apps/web` (Vite + React dashboard). Sprint planning: [planning/README.md](planning/README.md).

## Local development

1. Copy `.env.example` to `.env` and adjust if needed.
2. `pnpm install`
3. `docker compose up -d postgres redis` (or full stack: `docker compose up --build`)
4. `pnpm --filter @bruma/api run db:migrate` (applies all SQL in `apps/api/drizzle/`) then `pnpm --filter @bruma/api run dev`
5. In another terminal: `pnpm --filter @bruma/web run dev`

API defaults to `http://localhost:3000`, dashboard to `http://localhost:5173`. Set `ADMIN_API_KEY` in `.env` and use it as `X-API-Key` from the web app.

**Staging host** (Sprint 1 platform): provision separately and point `VITE_API_BASE_URL` / `ALLOWED_ORIGINS` at that environment; see `docs/cicd.md` and `docs/test-strategy.md`.

**Staging-style compose:** `docker-compose.staging.yml` documents ports and required env vars (`STAGING_*`); keep real secrets in a manager, not in git.

**Tenant API keys (Sprint 2):** besides `ADMIN_API_KEY`, you can create per-tenant keys via `POST /v1/tenants/:tenantId/api-keys` (returns the secret once). Those keys only allow access to that tenant’s routes.

**OpenAPI (Sprint 5):** with the API running, open `http://localhost:3000/docs` when docs are enabled (default in development; in production set `OPENAPI_DOCS_ENABLED=true` or leave disabled). Spec source: `apps/api/openapi/openapi.yaml`.

**Operators:** see [docs/operator-handover.md](docs/operator-handover.md) and [docs/glossary.md](docs/glossary.md).
