# Security & Privacy

Electron & Frontend
- Context isolation on; Node integration off.
- CSP blocks remote execution; only local HTTP to backend allowed.
- IPC surface limited and validated in `main.js`/`preload.js`.

Backend
- CORS via `.env` (`ALLOWED_ORIGINS`), include `null` for packaged Electron.
- File handling: type/size checks recommended; chunked uploads supported.
- Secrets: keep in `.env`; never bundle in app.
- Downloads are sanitized: allowed categories only, path traversal blocked, and file IDs restricted to safe characters.

Data
- SQLite in `<BACKEND_DATA_DIR>/` (WAL mode). Do not commit DB/media.
- Logs rotate; ensure secure file permissions in production.
