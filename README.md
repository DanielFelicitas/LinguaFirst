# LinguaFiRST

| Folder | Role |
| ------ | ---- |
| **`client/`** | Vite + React |
| **`server/`** | Express API + MongoDB |

## MERN split deploy on Vercel (matches common tutorial flow)

Do **not** commit `.env` files (see `.gitignore`). Use `.env.example` as a template.

### 1. Environment preparation (before / after Git)

- Keep secrets out of Git: `server/.env`, `client/.env` are ignored.
- **Local dev:** `VITE_API_URL` empty in `client/.env`; API runs on port **5000** (server), Vite on **5173** (client). Optional: `API_PROXY_TARGET` in `client/.env` if your API is not on `localhost:5000`.

### 2. Vercel config files (already in repo)

- **`server/vercel.json`** — rewrites traffic to the serverless API (`api/index.js`).
- **`client/vercel.json`** — Vite build + SPA fallback for React Router.

### 3. Deploy the **back-end** first (Vercel project for `server/`)

1. New Vercel project → **Root Directory** = **`server`**.
2. Environment variables (minimum):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - **`FRONTEND_URL`** — for the first deploy you can set `http://localhost:5173` **or** leave CORS open until step 5 (see note below).
   - Optional: `CLOUDINARY_*` if you use uploads.
3. Deploy. Copy the **production URL** of the API (e.g. `https://your-api.vercel.app`).

**CORS note:** If you set **`FRONTEND_URL`** / **`CLIENT_ORIGIN`** to a production URL before the front-end exists, the first deploy may block browser calls until step 5. If you omit both, CORS allows all origins (dev-friendly); set a real production origin before going live.

### 4. Deploy the **front-end** (second Vercel project for `client/`)

1. New Vercel project → **Root Directory** = **`client`** (same repo).
2. Environment variable:
   - **`VITE_API_URL`** = your **API** URL from step 3, **no trailing slash**  
     Example: `https://your-api.vercel.app`
3. Deploy. Copy the **production URL** of the front-end (e.g. `https://your-app.vercel.app`).

### 5. Final sync (critical)

1. Open the **server** project on Vercel → **Settings → Environment Variables**.
2. Set **`FRONTEND_URL`** (and/or **`CLIENT_ORIGIN`**) to your **front-end** production URL, e.g. `https://your-app.vercel.app` (comma-separated if you have multiple).
3. **Redeploy** the **server** so CORS picks up the real front-end origin.

### Variable map (cheat sheet)

| Where | Variable | Value |
| ----- | -------- | ----- |
| **Server (Vercel)** | `MONGODB_URI`, `JWT_SECRET`, Cloudinary vars | Secrets / Atlas |
| **Server (Vercel)** | **`FRONTEND_URL`** or **`CLIENT_ORIGIN`** | Your **front-end** URL(s) — CORS |
| **Client (Vercel)** | **`VITE_API_URL`** | Your **API** URL — fetch calls |

---

More detail: **`client/README.md`** and **`server/README.md`**.
