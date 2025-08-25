# Testing & CI

Backend
- Run: `cd notebook-mlx-app/backend && pytest`.
- Coverage: enforced at 80% via `pytest.ini` (`pytest-cov`).
- Tests:
  - `tests/test_app.py`: root health
  - `tests/test_openapi.py`: OpenAPI contract
  - `tests/test_endpoints.py`: health/metrics, download sanitization, text upload→chat, chunked upload→merge, TTS guards
- CI disables ML imports with `DISABLE_ML_IMPORTS=1` and uses lightweight stubs.

Frontend
- E2E: Playwright; config at `playwright.config.ts`, tests in `frontend/e2e/`.
- Run: `pnpm dlx playwright install && pnpm run build && pnpm run test:e2e`.
- CI uploads HTML report artifact.

Workflow
- `.github/workflows/ci.yml` runs pre-commit lint, backend tests, type-check/build, and E2E.
