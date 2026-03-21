# Planning

This folder holds small, importable planning documents aligned with the product docs in `proyecto/` (Plan Maestro, Backend/Frontend v2, DevOps/QA v1).

## File index

| File | Notes |
| --- | --- |
| [00-initial-config.md](00-initial-config.md) | Setup, accounts, integrations, standards (maps to ClickUp **Setup**). |
| [sprint-01-backend.md](sprint-01-backend.md) | Sprint 1 backend |
| [sprint-01-frontend.md](sprint-01-frontend.md) | Sprint 1 frontend |
| [sprint-01-platform.md](sprint-01-platform.md) | Sprint 1 DevOps + QA |
| [sprint-02-backend.md](sprint-02-backend.md) | Sprint 2 backend |
| [sprint-02-frontend.md](sprint-02-frontend.md) | Sprint 2 frontend |
| [sprint-02-platform.md](sprint-02-platform.md) | Sprint 2 DevOps + QA |
| [sprint-03-backend.md](sprint-03-backend.md) | Sprint 3 backend |
| [sprint-03-frontend.md](sprint-03-frontend.md) | Sprint 3 frontend |
| [sprint-03-platform.md](sprint-03-platform.md) | Sprint 3 DevOps + QA |
| [sprint-04-backend.md](sprint-04-backend.md) | Sprint 4 backend |
| [sprint-04-frontend.md](sprint-04-frontend.md) | Sprint 4 frontend |
| [sprint-04-platform.md](sprint-04-platform.md) | Sprint 4 DevOps + QA |
| [sprint-05-backend.md](sprint-05-backend.md) | Sprint 5 backend |
| [sprint-05-frontend.md](sprint-05-frontend.md) | Sprint 5 frontend |
| [sprint-05-platform.md](sprint-05-platform.md) | Sprint 5 DevOps + QA |

Sixteen planning documents plus this README.

## ClickUp lists ↔ repository files

| ClickUp list | Planning files in this repo |
| --- | --- |
| **Setup** | `00-initial-config.md` |
| **Sprint 1** | `sprint-01-backend.md`, `sprint-01-frontend.md`, `sprint-01-platform.md` |
| **Sprint 2** | `sprint-02-backend.md`, `sprint-02-frontend.md`, `sprint-02-platform.md` |
| **Sprint 3** | `sprint-03-backend.md`, `sprint-03-frontend.md`, `sprint-03-platform.md` |
| **Sprint 4** | `sprint-04-backend.md`, `sprint-04-frontend.md`, `sprint-04-platform.md` |
| **Sprint 5** | `sprint-05-backend.md`, `sprint-05-frontend.md`, `sprint-05-platform.md` |

Each sprint list holds **30** imported tasks (10 backend + 10 frontend + 10 platform) when all three files are present.

<a id="pr-clickup"></a>

## Pull requests ↔ ClickUp tasks

Use these rules so GitHub work stays traceable to a single planning task (and vice versa).

| Rule | Detail |
| --- | --- |
| **One primary task per PR** | Prefer one ClickUp task as the main scope of a PR. If a PR must cover several tasks, list every linked task ID in the description. |
| **Task reference in the PR** | Put the ClickUp identifier in the PR **title** or **description**: `CU-xxxx` when your integration exposes it, or `Related: ClickUp task <name or URL>`. |
| **Branch naming (optional)** | Pattern `feat/sprint-NN/short-topic` or `fix/sprint-NN/short-topic` so the sprint aligns with the list (e.g. `feat/sprint-02/dispatch-engine`). |
| **Description** | Briefly state what changed and how it satisfies the task’s acceptance criterion; paste the task link if not using `CU-xxxx`. |
| **Do not sync secrets or internal docs** | Do not attach sensitive `.docx` or credentials via GitHub–ClickUp automation; keep secrets in the secret manager / GitHub Secrets only. |

The GitHub connection for this repo is documented under [ClickUp import](#clickup-import) below.

## Agreed convention (naming and scope)

| What | Rule |
| --- | --- |
| **Root folder** | `planning/` at the repository root (this directory). |
| **Sprint files** | `sprint-NN-backend.md`, `sprint-NN-frontend.md`, `sprint-NN-platform.md` where `NN` is a two-digit sprint index (`01` … `05` in the MVP). |
| **Bootstrap file** | `00-initial-config.md` (setup and standards; same task format as sprint files). |
| **Items per file** | **10** numbered tasks per file (one line per importable ClickUp task). |

No other naming patterns are used for sprint planning markdown in this repo.

`NN` is always a two-digit sprint index from the MVP timeline (e.g. `01` … `05`). Each sprint file uses exactly one suffix: `backend`, `frontend`, or `platform` — never mix streams in the same file.

| File | Purpose |
| --- | --- |
| `00-initial-config.md` | Accounts, repos, integrations, standards (e.g. ClickUp “Setup” or Sprint 0). |
| `sprint-NN-backend.md` | Backend work for sprint `NN`. |
| `sprint-NN-frontend.md` | Frontend work for sprint `NN`. |
| `sprint-NN-platform.md` | DevOps + QA for that sprint window (compose, CI, staging, tests, security). |

## Task format

- Each file lists **exactly 10** numbered items.
- Each item is written as a **ClickUp-ready task**: verb + outcome + a short acceptance criterion.
- Optional final line per file: `ClickUp: …` (list or sprint name).

References to scope should point at document IDs (e.g. Plan Maestro v2, DOC-BE-01) rather than embedding sensitive binaries.

## ClickUp import

Tasks from this folder are imported as ClickUp tasks (one per numbered line) into list **Setup** for `00-initial-config.md`, and into **Sprint 1** … **Sprint 5** for `sprint-NN-*.md` (30 tasks per sprint list: backend + frontend + platform).

| List | ClickUp |
| --- | --- |
| Setup | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509676) |
| Sprint 1 | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509677) |
| Sprint 2 | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509681) |
| Sprint 3 | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509678) |
| Sprint 4 | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509679) |
| Sprint 5 | [Open list](https://app.clickup.com/90121567521/v/l/li/901216509680) |

**GitHub:** In ClickUp, open **App Center → GitHub** (or **Space settings → Integrations**) and connect this repository: [https://github.com/josebrusa/bruma-tools-dev](https://github.com/josebrusa/bruma-tools-dev). For how to reference tasks in PRs and what not to sync, see [Pull requests ↔ ClickUp tasks](#pr-clickup) above.

**Re-import / API:** To create tasks via the ClickUp REST API (e.g. another workspace), set `CLICKUP_API_TOKEN` from [ClickUp → Settings → Apps](https://app.clickup.com/settings/apps) and run `python3 scripts/import_planning_to_clickup.py --apply` after updating list ID env vars if needed (see script header).
