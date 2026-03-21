# Registry and CI credential rotation

## GitHub Container Registry (GHCR)

Images are published by [.github/workflows/publish-images.yml](../.github/workflows/publish-images.yml) on every push to `main`, using `GITHUB_TOKEN` with `packages: write`. No long-lived personal token is required for default pushes.

## Rotation checklist

1. **Compromised `GITHUB_TOKEN` scope** — rotate by invalidating the workflow run / re-running from a trusted commit; tokens are ephemeral per job.
2. **Optional deploy keys** — if you add a separate registry user or PAT for promotion pipelines, rotate PATs in GitHub **Settings → Secrets** and update the consuming workflow.
3. **Kubernetes / host pull secrets** — update `imagePullSecret` (or equivalent) to reference a new robot account or PAT before revoking the old one; roll deployments gradually.
4. **Verify** — after rotation, confirm `docker pull ghcr.io/<owner>/bruma-api:latest` (and worker/web) succeeds from the target environment.

Document the date and actor for each rotation in your sprint review or incident log.
