# Sprint 3 — Frontend

Scope references: DOC-FE-01 (Frontend Dashboard v2), §5 Sprint plan and §6 backlog — Branding, Templates (editor, preview, publish), and Event mappings; full tenant configuration path usable by operators.

1. **Implement Branding screen** — Logo URL field with image preview, primary color picker, save action, and loading/error states (DOC-FE-01 §3 Pantalla de Branding); acceptance: saved values reload from API and preview matches before save.

2. **Implement Templates list screen** — Show template name, active version indicator, and draft vs published state (DOC-FE-01 §3); acceptance: list refreshes after create/publish operations.

3. **Implement template create and HTML editor** — Basic HTML editing with syntax highlighting, side panel listing documented variables (DOC-FE-01 §6 “Editor de Plantillas”); acceptance: validation prevents empty invalid submissions.

4. **Implement template preview in a modal** — Call preview API with sample data and display rendered email HTML (DOC-FE-01 §3); acceptance: branding appears in preview when configured.

5. **Implement publish flow with confirmation** — Confirm dialog, call publish endpoint, update list state (DOC-FE-01 §6 “Publicar plantilla”); acceptance: only one active version is indicated after publish.

6. **Implement Event mappings screen** — List mappings and form to create event → template + sender with active flag (DOC-FE-01 §3); acceptance: created mappings appear and tie to existing published templates.

7. **Warn when mapping references unpublished template** — Inline warning or disable save when template is not published (DOC-FE-01 §6 “Pantalla de Eventos”); acceptance: operator understands why dispatch would fail.

8. **Align checklist completion with Sprint 3 modules** — Branding, template published, and event mapped items update when backend state changes (DOC-FE-01 §3); acceptance: checklist matches server truth after refresh.

9. **Harden empty and error states for new modules** — Each new screen has actionable empty states and mapped API errors (DOC-FE-01 §4); acceptance: no raw HTTP codes shown to users.

10. **Run end-to-end configuration smoke** — Operator flow: branding → template create → preview → publish → event map; acceptance: documented pass/fail for sprint review (DOC-FE-01 §5 Sprint 3 deliverables).

ClickUp: Sprint 3 · label `frontend`
