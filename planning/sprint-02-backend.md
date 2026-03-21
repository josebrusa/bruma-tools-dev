# Sprint 2 — Backend

Scope references: DOC-BE-01 (Backend Core v2), §6 Sprint plan and §7 backlog — SenderIdentity, BrandingProfile, Template Engine, API Key authentication, and preview.

1. **Implement SenderIdentity HTTP API** — Expose CRUD for senders under a tenant with email, display name, optional reply-to, and state fields per DOC-BE-01 §4 Sender Identity; acceptance: responses are tenant-scoped and persist correctly.

2. **Block sender creation on unverified domains** — Reject `POST` when the linked domain is not verified with a clear 4xx and no row created (DOC-BE-01 §4); acceptance: verified domain allows creation; pending/error domain does not.

3. **Implement BrandingProfile upsert API** — `POST /v1/tenants/:id/branding` (or equivalent) for `logo_url` and `color_primario` per DOC-BE-01 §4 Branding Engine; acceptance: read-back matches write and invalid URLs are rejected.

4. **Apply branding during template render** — Inject logo and primary color into rendered HTML for preview and downstream dispatch use (DOC-BE-01 §4); acceptance: rendered output contains branding markers or assets as designed.

5. **Implement Template CRUD HTTP API** — Create and list templates with metadata (name, description, draft/published state) per DOC-BE-01 §4 Template Engine; acceptance: templates are isolated by `tenant_id`.

6. **Persist TemplateVersion and render with Handlebars** — Store HTML/text and variable list; compile/render with `{{variable}}` syntax (DOC-BE-01 §4); acceptance: render succeeds for valid variables and fails predictably for missing ones.

7. **Implement publish active version endpoint** — Mark exactly one active version per template and ensure dispatch resolution uses it (DOC-BE-01 §4); acceptance: after publish, GET/preview reflects the new active version.

8. **Implement template preview endpoint** — `GET` preview with test payload returns rendered HTML with branding applied (DOC-BE-01 §5 API table); acceptance: response is stable JSON/HTML contract agreed with frontend.

9. **Implement API Key authentication** — Issue, hash, validate, and revoke admin API keys; protect dashboard/admin routes while leaving public dispatch contract ready for the next sprint (DOC-BE-01 §7 “API Keys”); acceptance: missing or invalid key yields 401; valid key sets tenant context.

10. **Publish an OpenAPI fragment for Sprint 2 endpoints** — Cover senders, branding, templates, versions, publish, preview, and auth-related schemas (DOC-BE-01 §5); acceptance: spec imports cleanly and matches implemented routes.

ClickUp: Sprint 2 · label `backend`
