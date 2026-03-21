# Staging rollback (images)

Use this when a staging deploy is unhealthy and you need the previous known-good revision.

## Prerequisites

- You know the **previous image tags** (or digests) for `api`, `worker`, and `web`, or the previous Git SHA used to build them.
- Access to the host or orchestrator where staging runs (Docker Compose, Kubernetes, etc.).

## Docker Compose (staging file)

1. Stop the stack: `docker compose -f docker-compose.staging.yml down` (omit `down` if you only swap images).
2. In your env file or CI variables, set image tags to the **previous** values (if you use explicit `image:` overrides) or rebuild from the previous Git commit:
   - `git checkout <previous-sha>` then `docker compose -f docker-compose.staging.yml build --no-cache` (only if you build on the host).
3. Run migrations **only** if the rollback moves backward to a schema that still matches; otherwise restore a DB snapshot taken before the bad deploy.
4. Start: `docker compose -f docker-compose.staging.yml up -d`.
5. Verify: `GET /health` on the API, enqueue a test dispatch, confirm worker logs show `provider accepted send` when `RESEND_API_KEY` is set.

## Notes

- Prefer **DB backup/restore** over partial migration rollback when schema moved forward.
- Keep rollback steps and last-good tags in your runbook or release notes per deploy.
