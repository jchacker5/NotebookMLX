# Operations

Docker
- Backend image: `notebook-mlx-app/backend/Dockerfile` (ML disabled by default).
- Compose: `docker-compose.yml` exposes `8000`, persists data at `/data` using `BACKEND_DATA_DIR`.
- Healthcheck hits `/healthz` to ensure the API is ready before dependents start.

Metrics & Logs
- Prometheus metrics at `/metrics`, health at `/healthz`.
- JSON logs in `<BACKEND_DATA_DIR>/app.log` with rotation.

Build & Releases
- macOS app: `cd notebook-mlx-app && pnpm run dist:mac`.
- Consider code signing + notarization for distribution.
- CI uploads frontend `dist/` and Playwright report as artifacts.

Load Testing
- Quick baseline: `k6 run k6/load-test.js`.

Data Directory
- Control with `BACKEND_DATA_DIR` (default `data/`). In production Electron builds, this is set to the OS user data directory.
