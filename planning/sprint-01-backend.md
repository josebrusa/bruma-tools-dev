# Sprint 1 — Backend

Scope references: DOC-BE-01 (Backend Core v2), §6 Sprint plan and §7 backlog — first two-week slice of the 10-week backend timeline.

1. **Initialize the backend repository and module layout** — Bootstrap the API service with language/tooling agreed by the team, baseline linting and formatting, environment-based configuration, and a clear folder structure for upcoming domains (tenant, domain, etc.); acceptance: project runs locally with `npm`/`pnpm` scripts, no lint errors on clean tree, first CI workflow passes on `main` (per DOC-BE-01 §7 “Setup proyecto”).

2. **Design and ship database migrations for the full schema** — Encode all entities from DOC-BE-01 §3 (including Phase 2/3 tables as empty or minimal if required by the doc) in versioned migrations; acceptance: migrations apply cleanly on an empty Postgres instance and match the documented fields and relationships.

3. **Implement Tenant CRUD HTTP API** — Expose create, read, update, and list operations with unique `slug` validation and technical metadata (name, contact, timezone) per DOC-BE-01 §4 Tenant Management; acceptance: requests return correct status codes and persisted data matches the contract.

4. **Implement tenant activate/deactivate behavior** — Support PATCH or equivalent to toggle tenant state and ensure inactive tenants are rejected for future dispatch paths (document blocking rule now even if dispatch arrives in a later sprint); acceptance: state changes are immediate and reflected in reads.

5. **Implement domain registration per tenant** — POST endpoint to register a domain for a tenant with validation and persistence per DOC-BE-01 §4 Domain Management; acceptance: domain rows are scoped to `tenant_id` and invalid input yields 4xx with clear errors.

6. **Generate and return DNS records for manual setup** — Return SPF, DKIM, and DMARC data as structured JSON suitable for operators to copy (DOC-BE-01 §4 Domain Management); acceptance: response shape is stable and documented for the dashboard team.

7. **Implement manual domain verification endpoint** — Trigger verification on demand (no periodic job in MVP), transitioning states pending → verified or error based on DNS checks (DOC-BE-01 §4); acceptance: successful verification updates `estado_verificación` / timestamps as designed.

8. **Expose a health check for orchestration** — Add `GET /health` (or equivalent) returning a simple OK payload for Docker/Kubernetes probes (aligned with DOC-OPS-01 §6 health checks); acceptance: endpoint responds without auth and returns JSON `{ "status": "ok" }` or documented variant.

9. **Wire persistence and shared infrastructure** — Database connection pooling, migration runner in deploy path, and shared error/validation helpers used by tenant and domain handlers; acceptance: concurrent requests behave safely and connection failures surface as structured errors.

10. **Publish an OpenAPI fragment for Sprint 1 endpoints** — Check in or generate a spec section covering tenant and domain routes implemented this sprint (DOC-BE-01 §5 API table; Plan Maestro v2 dependency on OpenAPI); acceptance: paths, methods, and example payloads for Sprint 1 are listed and importable into Swagger UI when wired in a later sprint.

ClickUp: Sprint 1 · label `backend`
