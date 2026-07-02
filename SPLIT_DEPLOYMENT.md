# Split Deployment: Frontend (Vercel) + Backend API (Render)

This app can run two ways:

- **Monolith** (default for local dev): Express serves both the API and the
  built React frontend from the same origin. Just `npm run dev`.
- **Split** (recommended for production): the static frontend is hosted on
  Vercel/Cloudflare Pages (free, always-on, instant page loads) and the Express
  API runs on Render. This doc covers the split.

## Why split?

On Render's free tier the whole app spins down after 15 minutes of inactivity,
so the *page itself* takes ~30–50s to load on the first visit. Hosting the
static frontend elsewhere makes the page load instantly; only the first API
call after idle waits for Render to wake.

## How the wiring works

There are no server-side sessions/cookies, so the only two things that make the
split work are:

1. **`VITE_API_URL`** (frontend, build time) — the API origin. The client
   prefixes every `/api/...` call with it (see `apiUrl()` in
   `client/src/lib/queryClient.ts`). Empty in local/monolith mode, so paths stay
   relative.
2. **`FRONTEND_URL`** (backend, runtime) — comma-separated frontend origin(s)
   allowed by CORS (see the CORS middleware in `server/index.ts`). Unset in
   local/monolith mode, where CORS is a no-op.

| Concern | Handled by |
|---|---|
| Client points at the right API | `VITE_API_URL` → `apiUrl()` |
| Browser allows cross-origin calls | `FRONTEND_URL` → CORS middleware |
| API-only build (no client bundle) | `npm run build:server`; `serveStatic` degrades gracefully |
| Frontend static build + SPA routing | `vercel.json` |

## Build scripts

| Script | Builds | Used by |
|---|---|---|
| `npm run build` | client + server (monolith) | local / single-service deploy |
| `npm run build:server` | server bundle only | Render (API) |
| `npm run build:client` | static frontend only → `dist/public` | Vercel (frontend) |

## Deploy steps

The two URLs reference each other, so deploy in this order.

### 1. Push to GitHub

The repo drives both deploys.

```bash
git init
git add .
git commit -m "Set up split frontend/backend deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Backend API on Render

1. Render dashboard → **New +** → **Blueprint** → pick this repo (uses
   `render.yaml`, which runs `npm run build:server`).
2. Set environment variables in the Render dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `FRONTEND_URL` — leave blank for now (you don't have the Vercel URL yet)
3. Deploy. Note the API URL, e.g. `https://leetcode-tracker.onrender.com`.
4. Verify: opening `<api-url>/health` returns `{ "status": "ok", ... }`.

### 3. Frontend on Vercel

1. Vercel → **Add New** → **Project** → import this repo (uses `vercel.json`).
2. Set environment variable:
   - `VITE_API_URL` = the Render API URL from step 2
     (⚠️ **no trailing slash, no `/api`** — e.g. `https://leetcode-tracker.onrender.com`)
3. Deploy. Note the frontend URL, e.g. `https://leetcode-tracker.vercel.app`.

### 4. Open CORS back to the frontend

1. Return to Render → the service → **Environment**.
2. Set `FRONTEND_URL` = the Vercel URL from step 3 (no trailing slash).
   For multiple origins (e.g. a custom domain), comma-separate them.
3. Save → the service redeploys/restarts.

Done. Visit the Vercel URL — the page loads instantly and API calls hit Render.

## Cloudflare Pages instead of Vercel

Same idea; there's no `vercel.json` equivalent needed — set these in the Pages
project:

- **Build command:** `npm run build:client`
- **Build output directory:** `dist/public`
- **Environment variable:** `VITE_API_URL` = the Render API URL
- **SPA routing:** add a `_redirects` file with `/*  /index.html  200`, or a
  "Single Page Application" fallback in the Pages settings.

Then add the Pages URL to Render's `FRONTEND_URL`.

## Gotchas

- **`VITE_API_URL` is baked in at build time, not runtime.** Changing it in
  Vercel requires a **redeploy** of the frontend to take effect.
- **CORS 403 / blocked requests** almost always mean `FRONTEND_URL` on Render
  doesn't exactly match the browser's origin. It must match scheme + host with
  **no trailing slash** (`https://app.vercel.app`, not `https://app.vercel.app/`).
- **Cold starts still affect the API.** Keep an uptime pinger pointed at the
  Render `<api-url>/health` (see `.github/workflows/keep-alive.yml`) so the first
  API call after idle isn't slow.
- **Preview deploys.** Each Vercel preview gets a unique URL that won't be in
  `FRONTEND_URL`, so its API calls will be CORS-blocked. Add the preview origin
  to `FRONTEND_URL` if you need previews to talk to the API, or test against a
  stable frontend URL.
