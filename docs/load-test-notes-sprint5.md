# Staging load test notes (Sprint 5)

Use this file to record quick staging load results for rate limits and hot paths (dispatch enqueue, `/v1/logs`, webhook handler).

## Environment

- Date:
- Staging URL:
- API version / git SHA:

## Scenarios

| Scenario | Tool | RPS / concurrency | P50 | P95 | Notes |
|----------|------|-------------------|-----|-----|-------|
| Dispatch enqueue | | | | | |
| Logs query | | | | | |
| Webhook ingest | | | | | |

## Configuration snapshot

- `API_RATE_LIMIT_MAX` / `API_RATE_LIMIT_MAX_TENANT` / `API_RATE_LIMIT_WINDOW_MS`
- `REQUEST_TIMEOUT_MS`
- Worker concurrency

## Verdict

- [ ] Within agreed P95 vs Sprint 4 baseline (or documented deviation approved by PO).
