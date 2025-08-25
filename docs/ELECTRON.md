# Electron Shell

Location: `notebook-mlx-app/electron`

Security
- `nodeIntegration: false`, `contextIsolation: true` in `BrowserWindow`.
- Strict CSP injected via `onHeadersReceived`.
- Dev CSP allows Vite HMR (`ws://localhost:3000`, `http://localhost:3000`); prod CSP blocks remote origins.
- Preload limits surface to: `openFile`, `saveFile`, `request` (validated).

Backend Startup
- Dev: spawns `python3 backend/main.py`.
- Prod: spawns packaged Python env under `python-dist/`.
- Logs backend stdout/stderr to console; times out on slow start.
 - Sets `BACKEND_DATA_DIR` to the OS user data directory so writes are not in the app bundle.

Main Files
- `main.js`: window creation, CSP, backend lifecycle, IPC validation.
- `preload.js`: `contextBridge` exposure for safe APIs.
