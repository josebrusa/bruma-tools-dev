# Bug report template (ClickUp / GitHub)

Use this structure when filing defects (DOC-QA-01 §6).

| Field | Description |
| --- | --- |
| **Title** | Short, specific (component + symptom). |
| **Severity** | `S1` blocker / `S2` major / `S3` minor / `S4` cosmetic. |
| **Steps** | Numbered reproduction steps. |
| **Expected** | Correct behaviour. |
| **Actual** | What happened instead. |
| **Environment** | `local` / `staging` / `prod`, browser/OS if UI, commit SHA or release. |
| **Evidence** | Screenshots, HAR, API response body, correlation id if available. |
| **Related task** | ClickUp URL or `CU-xxxx`; link PR if known. |

**SLA (suggested MVP):** S1 same day triage; S2 within 2 business days; S3+ best effort within the sprint.
