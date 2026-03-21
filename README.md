# bruma-tools-dev

Monorepo MVP layout: `apps/api` (HTTP API), `apps/worker` (queue consumer placeholder), `apps/web` (Vite + React dashboard). Sprint planning: [planning/README.md](planning/README.md).

## Local development

1. Copy `.env.example` to `.env` and adjust if needed.
2. `pnpm install`
3. `docker compose up -d postgres redis` (or full stack: `docker compose up --build`)
4. `pnpm --filter @bruma/api run db:migrate` then `pnpm --filter @bruma/api run dev`
5. In another terminal: `pnpm --filter @bruma/web run dev`

API defaults to `http://localhost:3000`, dashboard to `http://localhost:5173`. Set `ADMIN_API_KEY` in `.env` and use it as `X-API-Key` from the web app.

**Staging host** (Sprint 1 platform): provision separately and point `VITE_API_BASE_URL` / `ALLOWED_ORIGINS` at that environment; see `docs/cicd.md` and `docs/test-strategy.md`.
