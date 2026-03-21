# Operations runbook v1 (Sprint 4 draft)

Template aligned with DOC-OPS-01. **Production provisioning, alerting, backups, and full regression** remain human / infra tasks: track status in ClickUp Sprint 4 (platform) until completed.

## Deploy (staging / prod pattern)

1. Build and publish images (CI or manual) for `api`, `worker`, `web`.
2. Apply database migrations: `pnpm --filter @bruma/api run db:migrate` against the target `DATABASE_URL`.
3. Roll out stack with required env: `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, `WEBHOOK_SECRET`, `ADMIN_API_KEY`, `ALLOWED_ORIGINS`, `VITE_API_BASE_URL` (build-time for web).

## Rollback

1. Revert to previous image tags for each service.
2. If a migration was **forward-only**, document manual SQL steps; avoid destructive migrations without a backup.

## Health

- API: `GET /health` (database probe).
- Worker: process liveness via orchestrator; queue depth monitored externally (see platform tasks).

## Common incidents (placeholders)

| Symptom | Check | Owner |
| --- | --- | --- |
| Dispatch stuck queued | Redis / worker logs / queue depth | DevOps |
| 401 on webhooks | `WEBHOOK_SECRET` mismatch with provider | Backend |
| 429 spikes | `API_RATE_LIMIT_*` tuning | Backend / DevOps |

## Who to page

- Define in your org chart; link Slack / PagerDuty routes in ClickUp when live.

## Review

- Backend and QA leads should review this file before marking the platform “runbook” task complete.
