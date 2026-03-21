# Test strategy v1 (Sprint 1)

References: DOC-QA-01 (QA v1) §2 pyramid and Sprint 1 deliverables.

## Pyramid

1. **Unit** — Pure functions and small modules (slug/FQDN validation, DNS record bundle shape, DNS verification helpers). Run in CI via `pnpm --filter @bruma/api test`.
2. **Integration** — API + Postgres flows: extend in Sprint 2+ with testcontainers or compose-backed job; not required for first green CI in Sprint 1 beyond unit coverage.
3. **E2E** — Playwright smoke (`apps/web/e2e`): login page load. Expand to full tenant CRUD against `docker compose` in later sprints.

## Tooling

- **Vitest** (`@bruma/api`) for Node unit tests.
- **Playwright** (`@bruma/web`) for browser smoke.
- Target: **≥70%** line coverage on **new** code once integration suites land; current focus is critical-path logic (tenant/domain/DNS helpers).

## Entry criteria for staging

- CI green on `main` (lint, unit tests, builds, smoke E2E).
- Migrations apply cleanly on empty Postgres (`pnpm --filter @bruma/api run db:migrate`).
- No secrets committed; staging credentials only in the secret store / CI vars.

## Exit criteria (Sprint 1 review)

- Manual checklist: login → list tenants → create → edit → activate/deactivate against local compose or staging (see Sprint 1 frontend task 10).
