# Supabase Authentication — Setup

The whole app is behind login. Sign-in methods: **Email + password**, **Google**, and **Magic link**.
Follow these steps once, then set the env vars.

## 1. Get your project keys
In the [Supabase dashboard](https://supabase.com/dashboard) → your project → **Project Settings → API**:
- **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`

Add them to `.env` (never commit `.env` — it's gitignored):

```env
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

> The `VITE_` pair is read by the browser; the non-prefixed pair is read by the Express server to
> verify access tokens on protected routes. Use the **same** project for both.

## 2. Enable the sign-in methods
Dashboard → **Authentication → Providers**:
- **Email** — enable. (Optional: turn "Confirm email" off for faster local testing.)
- **Google** — enable, then paste a Google OAuth **Client ID + Secret**
  (create them at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
  OAuth client → Web application). In Google, set the **Authorized redirect URI** to:
  `https://YOUR-REF.supabase.co/auth/v1/callback`
- **Magic link** is part of the Email provider — no extra config.

## 3. Allowed redirect URLs
Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:5000` (for local) — change to your deployed URL in production.
- **Redirect URLs:** add every origin the app runs on, e.g.
  - `http://localhost:5000`
  - `https://leetcode-tracker.vercel.app` (your deployed frontend)

OAuth and magic-link both redirect back to `window.location.origin`, which must be in this list.

## 4. Run
```bash
npm install
npm run build      # or: npm run dev
npm start
```
Open http://localhost:5000 — you'll see the **login screen**. Create an account or sign in.

## Notes
- **What's protected:** the entire UI is behind login. On the server, all data-changing routes
  (`POST/PATCH/DELETE` under `/api` — sync, import, add/delete/edit students) require a valid token.
  Read-only `GET` routes stay public to keep dashboards fast.
- **Lock reads too (optional):** in `server/index.ts`, add `app.use("/api", requireAuth)` before the
  routes are registered — one line — to require a session for every API call.
- **Restrict who can sign up (optional):** Supabase → Authentication → Providers → disable public
  sign-ups, or add an allowlist/role check in `server/middleware/require-auth.ts`.
