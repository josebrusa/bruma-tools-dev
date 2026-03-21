# Sprint 2 — Frontend

Scope references: DOC-FE-01 (Frontend Dashboard v2), §5 Sprint plan and §6 backlog — Domains, Senders, DNS panel, manual verification, and tenant configuration checklist.

1. **Build the Domains list screen** — Table or cards listing domains per active tenant with visual status (pending / verified / error) per DOC-FE-01 §3; acceptance: data loads from the API with loading and error states.

2. **Implement register-domain flow** — Form calling `POST` to register a domain and refresh the list; acceptance: success and validation errors use toasts per DOC-FE-01 §4.

3. **Implement copyable DNS records panel** — Monospace table for SPF, DKIM, and DMARC with per-field copy buttons (DOC-FE-01 §6 “Panel DNS copiable”); acceptance: operators can copy without manual selection.

4. **Implement manual verification action** — Button triggering verify endpoint with spinner and result message (DOC-FE-01 §3 Pantalla de Dominios); acceptance: UI reflects API state after completion.

5. **Build the Senders list screen** — List senders for the selected tenant with key fields (email, display name, state); acceptance: empty state when none exist with CTA aligned to DOC-FE-01 §4.

6. **Implement create-sender flow** — Form posting to sender API; when domain is not verified, show blocking message and disable submit (DOC-FE-01 §6); acceptance: cannot create sender without verified domain.

7. **Add the tenant configuration checklist** — Six items: domain registered / domain verified / sender created / branding configured / template published / event mapped — with completed, pending, and error styling (DOC-FE-01 §3); acceptance: checklist reflects real configuration state from APIs or aggregated calls.

8. **Wire checklist items to deep links** — Each item navigates to the correct module route (DOC-FE-01 §3); acceptance: links work with tenant context preserved.

9. **Polish cross-module consistency for Sprint 2** — Confirm tenant selector, sidebar, and active tenant banner behavior across new screens (DOC-FE-01 §3); acceptance: no broken routes when switching tenants.

10. **Run integration smoke with Sprint 2 backend** — Manual checklist: register domain → copy DNS → verify → create sender → checklist updates; acceptance: recorded pass/fail for sprint review (DOC-FE-01 §5 Sprint 2 deliverables).

ClickUp: Sprint 2 · label `frontend`
