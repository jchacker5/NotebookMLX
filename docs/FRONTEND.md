# Frontend (React + Vite)

Location: `notebook-mlx-app/frontend`

Stack
- React 18 + TypeScript, Vite dev server, Tailwind, React Query, Axios.
- `vite.config.ts` proxies `/api` → `http://localhost:8000` in dev.

Key Areas
- `src/App.tsx`: notebooks view + main panels (Sources, Chat, Studio).
- `src/services/api.ts`: API client with request IDs, cancellation, chunked uploads.
- `src/components/*`: UI components; `ErrorBoundary`, `Toast` for UX resilience.
 - Electron packaging: API baseURL auto-switches to `http://127.0.0.1:8000/api` when running under `file://`.

Commands
- Dev: `pnpm start`
- Build: `pnpm run build` → `dist/`
- E2E: `pnpm dlx playwright install && pnpm run build && pnpm run test:e2e`

Chunked Uploads
- Large files (>= 8MB) are uploaded via `uploadSourceChunked()` automatically from the Sources panel.
- Progress and status are surfaced via toasts; small files use the standard upload path.
