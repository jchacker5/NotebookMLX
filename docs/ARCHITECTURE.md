# Architecture Overview

This repository contains a desktop app built with Electron (shell), a React + Vite frontend, and a FastAPI backend that runs locally. ML workloads use Apple’s MLX stack for on-device inference.

- Electron: boots the app, starts the Python backend, enforces CSP, and exposes minimal, validated IPC via `preload.js`.
- Frontend: Vite + React + TypeScript UI under `notebook-mlx-app/frontend`. Uses React Query, Tailwind, and Axios.
- Backend: FastAPI under `notebook-mlx-app/backend`. Provides PDF processing, chat, TTS, and mind map endpoints.
- ML Modules: `backend/ml/` implements PDF cleanup, transcript writing, and rewriting on MLX models.
- Data: SQLite (via `backend/utils/database.py`), media and cache in `backend/data/`.

Data Flow
- Upload → `/api/upload-source` parses PDFs, caches processed text by content hash, and stores metadata in SQLite.
- Chat → `/api/chat` composes response (stub-friendly for CI) and returns lightweight citations.
- Podcast → `/api/generate-podcast` generates transcripts (and audio when TTS is available) as a background task.
- Electron ↔ Backend → Backend started by the main process; frontend fetches via HTTP. IPC only for OS dialogs.

Observability
- JSON logs with rotation at `data/app.log`.
- Prometheus metrics on `/metrics`; health on `/healthz`.

