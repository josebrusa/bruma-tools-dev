# Sprint 2 test report

Date: 2026-03-21 (engineering snapshot)

## Automated

- **Unit / module:** Vitest in `@bruma/api` — tenant/domain helpers, DNS helpers, Handlebars template rendering (strict variables + branding wrapper).
- **Lint / build:** ESLint + `tsc` + Vite production build for `@bruma/web`; API `tsc` build.
- **E2E smoke:** Playwright — login page load (`apps/web/e2e/smoke.spec.ts`).
- **CI:** [ci.yml](../.github/workflows/ci.yml) runs install, lint, test, build, Playwright on PRs and `main`.

## Integration (API + Postgres)

- **Local:** Run `docker compose up -d postgres redis`, apply migrations, then exercise flows manually (domains → verify → senders → branding → templates → publish → checklist).
- **CI follow-up (recommended):** Add a job with a Postgres service container, run `db:migrate`, then extend Vitest with `fastify.inject` smoke tests — not yet wired as a required check.

## Security

- **Tenant isolation / API keys:** Covered by code review + manual checks; automated multi-tenant inject tests are a backlog item for a Postgres-backed CI job.
- **401 behaviour:** Invalid `X-API-Key` is rejected for both admin and tenant keys (tenant keys resolved via SHA-256 hash of stored secrets).

## Defects

- None filed from this snapshot; track new issues via [bug-report-template.md](./bug-report-template.md).

## Coverage vs target

- Target ≥70% on new code: not enforced yet (no coverage gate in CI). Next step: enable `vitest --coverage` for `@bruma/api` and ratchet thresholds per module.
