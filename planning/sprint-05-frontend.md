# Sprint 5 — Frontend

Scope references: DOC-FE-01 (Frontend Dashboard v2), §5 Sprint plan and §6 backlog — E2E validation with QA, defect fixes, operator UX review, demo, and MVP approval.

1. **Execute E2E suite with QA on staging** — Run Playwright/Cypress (or agreed tool) against critical flows: auth, tenant setup, dispatch-related configuration, logs (DOC-QA-01 §2); acceptance: failures triaged with linked bugs.

2. **Fix P0/P1 UI and integration defects** — Address blocking issues from QA and E2E runs (DOC-QA-01 §6); acceptance: no open P0; P1 cleared or deferred with PO approval.

3. **Schedule operator UX review sessions** — Walk through real tasks with internal operators; collect friction on Logs, Templates, and Events (DOC-FE-01 §1); acceptance: notes and prioritized follow-ups filed.

4. **Implement quick-win UX fixes from review** — Target changes that fit within Sprint 5 (copy, defaults, keyboard focus, obvious layout bugs); acceptance: agreed subset closed before demo.

5. **Basic accessibility pass** — Focus order, labels on forms, and color contrast for status indicators (DOC-FE-01 §4); acceptance: no critical a11y blockers for internal tool bar agreed with PO.

6. **Performance sanity check on large lists** — Tenants, logs, and templates with pagination or virtual scroll if needed (DOC-FE-01 §3); acceptance: acceptable behavior on representative data volume.

7. **Finalize product copy and terminology** — Align labels with API and operator vocabulary across modules (DOC-FE-01 §4); acceptance: glossary or README snippet if needed.

8. **Prepare stakeholder demo build** — Tagged frontend build against stable staging API for demo day (DOC-FE-01 §5 Sprint 5); acceptance: demo checklist executed without blockers.

9. **Handover pack for operators** — Short guide: URLs, how to log in, checklist usage, and where to report issues (DOC-FE-01 goals); acceptance: linked from project README or wiki.

10. **MVP frontend sign-off** — PO and QA confirm dashboard meets DOC-FE-01 MVP scope (DOC-FE-01 §5 Sprint 5); acceptance: approval recorded in sprint review.

ClickUp: Sprint 5 · label `frontend`
