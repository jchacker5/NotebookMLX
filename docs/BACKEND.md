# Backend (FastAPI)

Location: `notebook-mlx-app/backend`

Key Modules
- `main.py`: API routes, CORS, metrics, logging, background tasks.
- `ml/`: `pdf_processor.py`, `transcript_generator.py`, `rewriter.py` (MLX models).
- `utils/`: `database.py` (SQLite with WAL), `file_manager.py` (uploads, chunks, paths).

Endpoints (selection)
- `GET /` → health banner, `GET /healthz` → health, `GET /metrics` → Prometheus.
- `POST /api/upload-source` → process PDF/text, store source.
- `POST /api/chat` → respond using uploaded sources.
- `POST /api/generate-podcast` → background transcript/tts; `GET /api/task/{id}` for status.
- `POST /api/upload-chunk`, `POST /api/merge-chunks` → large file uploads.

Environment
- `BACKEND_HOST`, `BACKEND_PORT`, `ALLOWED_ORIGINS`, `ALLOW_CREDENTIALS`.
- `DISABLE_ML_IMPORTS=1` to stub ML during tests/CI.
- `GEN_CONCURRENCY` to limit concurrent generation.

Observability
- JSON logs to `data/app.log` (rotated). Prometheus counters/histograms per route.

Run
- `pip install -r requirements.txt && python3 main.py`
- Docker: `docker compose up --build` (ML disabled by default).

