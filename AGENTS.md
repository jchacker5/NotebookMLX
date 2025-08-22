# Repository Guidelines

## Project Structure & Module Organization
- Root: research notebooks (`Step-*.ipynb`), shared `resources/`, Chinese docs `zh_CN/`.
- `notebook-mlx-app/`: desktop app (Electron + React + FastAPI).
  - `frontend/`: Vite + React + TypeScript UI.
  - `backend/`: FastAPI service; MLX models in `backend/ml/`, utilities in `backend/utils/`, data in `backend/data/`.
  - `electron/`: main and preload processes.
  - `scripts/`, `assets/`, `python-dist/` (packaged Python for distribution).

## Build, Test, and Development Commands
- Install notebook deps (for Jupyter workflows):
  - `pip install -r requirements.txt`
- App development (runs backend, frontend, Electron):
  - `cd notebook-mlx-app && pnpm install`
  - `cd backend && pip install -r requirements.txt && cd ..`
  - `pnpm start` — starts FastAPI on 8000, Vite on 3000, then Electron.
- Frontend only: `cd notebook-mlx-app/frontend && pnpm start`
- Backend only: `cd notebook-mlx-app/backend && uvicorn main:app --reload`
- Production build (macOS): `cd notebook-mlx-app && pnpm run dist:mac`
- Docker (backend): `docker compose up --build` (serves on `:8000`)
  - Uses `BACKEND_DATA_DIR=/data` and includes a `/healthz` healthcheck.

## Coding Style & Naming Conventions
- Python (backend):
  - 4-space indentation, type hints where practical, snake_case for functions/variables.
  - Keep FastAPI routes thin; put logic in `ml/` and `utils/`. Raise `HTTPException` for API errors.
- JS/TS (frontend/electron):
  - 2-space indentation, camelCase for variables/functions, PascalCase for React components.
  - Keep UI code in `frontend/src/**`; avoid business logic in components. Type with TS.

## Testing Guidelines
- No formal test suite is present yet.
- Recommended patterns when adding tests:
  - Backend: `pytest` with files as `tests/test_*.py`; spin up app via `from backend.main import app` and use FastAPI `TestClient`.
  - Frontend: Vitest + React Testing Library with files `src/**/*.test.tsx`.
  - Keep sample fixtures under `tests/fixtures/` and mock model calls.

## Tooling & CI
- Pre-commit: configured with Black, Isort, Ruff, and Prettier (`.pre-commit-config.yaml`).
- CI (GitHub Actions): lints (pre-commit), runs backend tests (coverage ≥80%), builds frontend, and runs Playwright E2E with HTML report artifacts.

## Commit & Pull Request Guidelines
- Use concise, conventional commits; existing history mixes scopes + emojis, e.g.:
  - `✨ feat(backend): add PDF processor`
  - `🔧 fix(frontend): adjust build path`
- PRs should include:
  - Clear description, linked issues, and rationale.
  - Steps to reproduce and test notes; UI changes should include screenshots.
  - Small, focused diffs; update docs where relevant (README/BUILD/INSTALL).

## Security & Configuration Tips
- Do not commit secrets or large artifacts: `backend/.env`, `models/`, generated media under `backend/data/`.
- macOS is required; Apple Silicon is recommended for MLX performance. Models download on first use.
- Prefer environment variables for ports and paths; keep user data under `backend/data/`.
