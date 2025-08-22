# Backend (FastAPI)

Location: `notebook-mlx-app/backend`

Key Modules
- `main.py`: API routes, CORS, metrics, logging, background tasks.
- `ml/`: `pdf_processor.py`, `transcript_generator.py`, `rewriter.py` (MLX models).
- `utils/`: `database.py` (SQLite with WAL), `file_manager.py` (uploads, chunks, paths).

Endpoints (selection)
- `GET /` → health banner, `GET /healthz` → health, `GET /metrics` → Prometheus (returns metrics bytes, not a file).
- `POST /api/upload-source` → process PDF/text, store source.
- `POST /api/chat` → respond using uploaded sources.
- `POST /api/generate-podcast` → background transcript/tts; `GET /api/task/{id}` for status.
- `POST /api/upload-chunk`, `POST /api/merge-chunks` → large file uploads (parameters via `multipart/form-data` and `Form(...)` fields).

Environment
- `BACKEND_HOST`, `BACKEND_PORT`, `ALLOWED_ORIGINS`, `ALLOW_CREDENTIALS`.
- `DISABLE_ML_IMPORTS=1` to stub ML during tests/CI.
- `GEN_CONCURRENCY` to limit concurrent generation.
  - When TTS is disabled, `/api/synthesize-voice` and `/api/train-voice` return 503/error.

Observability
- JSON logs to `data/app.log` (rotated). Prometheus counters/histograms per route.

Contract
- `chat` response citations use camelCase keys: `{ sourceId, filename, relevance }`.
- `source_ids` must be non-empty for chat/generation endpoints.

Run
- `pip install -r requirements.txt && python3 main.py`
- Docker: `docker compose up --build` (ML disabled by default).
