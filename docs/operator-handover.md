# Operator handover — Bruma dashboard (MVP)

## URLs

- **Dashboard:** staging/production URL from your environment (local default `http://localhost:5173`).
- **API:** set in `VITE_API_BASE_URL` for the web app (local default `http://localhost:3000`).

## Access

1. Obtain an **admin API key** (`ADMIN_API_KEY` on the API) from your administrator.
2. Open the dashboard login page (`/login`).
3. Paste the key and continue. The app stores the key in **browser localStorage** (device-specific; clear storage to sign out).

## Daily usage

- **Overview** — Checklist flags for onboarding (domain, sender, branding, template, event mapping).
- **Tenants** — Create/manage tenants (admin).
- **Domains, Senders, Branding, Templates, Events** — Configure per selected tenant.

## Reporting issues

- Open a ticket in your team tracker (e.g. ClickUp) with steps, tenant id (if safe to share), and approximate time; attach `X-Request-Id` from API responses if available.

## Related docs

- [Glossary](glossary.md) — UI and API terminology.
- [MVP demo script](mvp-demo-script.md) — End-to-end API flow for demos.
