# Sprint 1 — Frontend

Scope references: DOC-FE-01 (Frontend Dashboard v2), §5 Sprint plan and §6 backlog — SPA setup, auth shell, and tenant management.

1. **Initialize the SPA project** — Bootstrap the dashboard app with the chosen stack (e.g. Vite + React), client-side routing, global state container, and base design tokens (spacing, typography, colors); acceptance: `dev` and production build succeed with zero errors, baseline CI green (DOC-FE-01 §6 “Setup proyecto SPA”).

2. **Implement authentication shell and protected routing** — Login flow using API Key or admin credentials per product decision, session/token handling, and route guards so unauthenticated users redirect to login; acceptance: protected routes are inaccessible without valid auth (DOC-FE-01 §3 layout, §6 “Auth + layout”).

3. **Build application layout** — Top navbar with active tenant placeholder or selector stub, sidebar with module links (even if some routes show “coming soon”), and visible tenant status (active/inactive) when a tenant is selected; acceptance: layout renders consistently across routed views (DOC-FE-01 §3).

4. **Implement Tenants list screen** — Table or card list showing tenants with name, slug, and status; acceptance: list loads from the API using `VITE_API_BASE_URL`, shows loading and error states (DOC-FE-01 §6 “Pantalla Tenants”).

5. **Implement create-tenant flow** — Form with client-side validation calling `POST /v1/tenants` (or equivalent), success and error feedback via toasts; acceptance: new tenant appears in the list after success without full page reload (DOC-FE-01 §4 feedback rules).

6. **Implement edit and activate/deactivate tenant** — UI to update tenant fields and toggle active state with explicit confirmation for destructive actions; acceptance: PATCH calls succeed and UI reflects server state (DOC-FE-01 §6, §4 confirmaciones).

7. **Add shared API client and error mapping** — Central HTTP client with base URL from env, auth header injection, and mapping of HTTP errors to user-readable messages (no raw “Error 422” strings); acceptance: simulated API errors show actionable copy (DOC-FE-01 §4 “Manejo de errores API” foundation).

8. **Configure environment and build-time API base URL** — Document and wire `VITE_API_BASE_URL` (or equivalent) for dev/staging per DOC-OPS-01 §3; acceptance: switching `.env` targets the correct API without code changes.

9. **Implement empty states for the Tenants module** — When no tenants exist, show guidance and a primary CTA to create one; acceptance: empty state matches internal-dashboard tone (DOC-FE-01 §4 estados vacíos).

10. **Smoke-test integration with Sprint 1 backend** — End-to-end manual checklist: login → list tenants → create → edit → activate/deactivate against staging or local compose; acceptance: documented pass/fail note in the sprint review (DOC-FE-01 §5 deliverable “Gestión de tenants operativa”).

ClickUp: Sprint 1 · label `frontend`
