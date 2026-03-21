# CI/CD branch rules (Sprint 1)

Aligned with `00-initial-config` and Sprint 1 platform tasks.

- **`main`** is protected: pull requests require review and a green **GitHub Actions** workflow (`.github/workflows/ci.yml`) before merge.
- **CI pipeline** runs on every push and PR to `main`: `pnpm install --frozen-lockfile`, lint (`pnpm -r lint`), unit tests (`pnpm -r test`), production builds (`pnpm -r build`), and a Playwright smoke test in `apps/web`.
- **Container images:** on push to `main`, [publish-images.yml](../.github/workflows/publish-images.yml) builds and pushes `bruma-api`, `bruma-worker`, and `bruma-web` to `ghcr.io` (see [registry-rotation.md](./registry-rotation.md)).
- **Releases**: promote to staging/prod per team policy (tags or manual approval); no auto-deploy to production from this repo in Sprint 1.
- **Secrets**: never commit `.env`; use GitHub Actions secrets and your cloud secret manager for `DATABASE_URL`, `REDIS_URL`, `ADMIN_API_KEY`, and `VITE_API_BASE_URL` in non-local environments.
