# Sprint 4 — Frontend

Scope references: DOC-FE-01 (Frontend Dashboard v2), §5 Sprint plan and §6 backlog — Logs with filters and delivery detail, empty states, error handling polish, and visual consistency across modules.

1. **Implement Logs list screen** — Table showing timestamp, event name, recipient, status, and tenant (when applicable) per DOC-FE-01 §3 Pantalla de Logs; acceptance: loads paginated data from logs API with loading and error states.

2. **Add filters for tenant, status, and date range** — Wire query params or client-side filter UX to API capabilities (DOC-FE-01 §3); acceptance: filtered results match backend contract and empty filter shows appropriate message.

3. **Implement dispatch detail side panel** — Click row opens panel with delivery timeline: queued → sent → delivered or bounced/failed (DOC-FE-01 §6 “Timeline de entrega”); acceptance: events ordered chronologically with clear labels.

4. **Apply status color coding** — Distinct styles for queued, sent, delivered, bounced, and failed (DOC-FE-01 §3); acceptance: legend or labels understandable without external docs.

5. **Audit empty states across all MVP modules** — Tenants, Domains, Senders, Branding, Templates, Events, and Logs each have informative copy and CTA (DOC-FE-01 §6 “Estados vacíos”); acceptance: QA checklist signed off per screen.

6. **Standardize API error presentation** — Ensure toasts and inline errors use mapped messages everywhere introduced in Sprints 1–4 (DOC-FE-01 §4); acceptance: spot test with forced 4xx/5xx responses.

7. **Unify loading and skeleton patterns** — Consistent spinners or skeletons for lists and detail fetches (DOC-FE-01 §4 feedback rules); acceptance: no layout jump without feedback on slow networks.

8. **Visual consistency pass** — Spacing, typography tokens, table density, and sidebar highlight for active route (DOC-FE-01 §4); acceptance: internal design checklist completed.

9. **Operator debugging workflow documentation** — Short internal note: how to trace a failed send using Logs + timeline (DOC-FE-01 goals); acceptance: linked from README or wiki.

10. **Full dashboard regression smoke** — Manual pass across all modules on staging (DOC-FE-01 §5 Sprint 4 deliverables); acceptance: pass/fail recorded for sprint review.

ClickUp: Sprint 4 · label `frontend`
