# Operations

Docker
- Backend image: `notebook-mlx-app/backend/Dockerfile` (ML disabled by default).
- Compose: `docker-compose.yml` exposes `8000`, persists `backend/data/`.

Metrics & Logs
- Prometheus metrics at `/metrics`, health at `/healthz`.
- JSON logs in `data/app.log` with rotation.

Build & Releases
- macOS app: `cd notebook-mlx-app && pnpm run dist:mac`.
- Consider code signing + notarization for distribution.
- CI uploads frontend `dist/` and Playwright report as artifacts.

Load Testing
- Quick baseline: `k6 run k6/load-test.js`.

