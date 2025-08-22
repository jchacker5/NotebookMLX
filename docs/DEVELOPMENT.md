# Development Guide

Prereqs
- Node.js 20+, pnpm; Python 3.10+ with venv.
- macOS (Apple Silicon recommended) for MLX acceleration.

Install and Run (Dev)
1) Frontend
   - `cd notebook-mlx-app/frontend && pnpm install && pnpm start` (Vite on 3000)
2) Backend
   - `cd notebook-mlx-app/backend && pip install -r requirements.txt && python3 main.py` (API on 8000)
3) Electron (optional)
   - `cd notebook-mlx-app && pnpm start` (spawns backend+frontend+Electron)

Environment
- Backend `.env` (see `.env.example`): `BACKEND_HOST`, `BACKEND_PORT`, `ALLOWED_ORIGINS`, `GEN_CONCURRENCY`, `BACKEND_DATA_DIR`.
- Disable ML in CI/dev quickly: `DISABLE_ML_IMPORTS=1`.
- Electron sets `BACKEND_DATA_DIR` to the OS user data dir in production.

Commands
- Frontend build: `cd frontend && pnpm run build` → `frontend/dist/`
- App dist (macOS): `pnpm run dist:mac`
- Pre-commit: `pre-commit install` then `pre-commit run -a`
- Tests: Backend `pytest` (coverage enforced), Frontend E2E `pnpm dlx playwright install && pnpm run test:e2e`.

Data & Paths
- DB/media live in `notebook-mlx-app/backend/data/`.
- Processed text cache under `data/processed/` keyed by file hash.
