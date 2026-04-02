# LinguaFiRST

| Folder | Role |
| ------ | ---- |
| **`client/`** | Vite + React |
| **`server/`** | Express API + MongoDB |

## MERN split deploy on Vercel

Aligned with **`Inventory-Management-System`** in the same workspace: **`FRONTEND_URLS`**, **`ALLOW_VERCEL_PREVIEWS`**, **`VITE_API_URL`**, and **Cloudinary** env names / precedence (trio over **`CLOUDINARY_URL`**). LinguaFiRST keeps **`serverless-http`** + **`api/index.js`** on the API; the IMS repo uses **`@vercel/node`** — both are valid on Vercel.

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
   - **`FRONTEND_URLS`** — comma-separated origins, e.g. `http://localhost:5173,https://your-app.vercel.app` (same pattern as the Inventory Management System). You can use **`FRONTEND_URL`** / **`CLIENT_ORIGIN`** instead or together; all are merged.
   - Optional: `CLOUDINARY_*` if you use uploads. Preview frontends (`*.vercel.app`) are allowed **by default** on Vercel; set `ALLOW_VERCEL_PREVIEWS=false` on the API to disable.
3. Deploy. Copy the **production URL** of the API (e.g. `https://your-api.vercel.app`).

**CORS note:** If you lock CORS to specific origins but omit your production front-end URL, the browser will block calls until you add it (step 5). If you omit **`FRONTEND_URLS`**, **`FRONTEND_URL`**, and **`CLIENT_ORIGIN`** entirely, CORS allows all origins (dev-friendly); set real origins before going live.

### 4. Deploy the **front-end** (second Vercel project for `client/`)

1. New Vercel project → **Root Directory** = **`client`** (same repo).
2. Environment variable:
   - **`VITE_API_URL`** = your **API** URL from step 3, **no trailing slash**  
     Example: `https://your-api.vercel.app`
3. Deploy. Copy the **production URL** of the front-end (e.g. `https://your-app.vercel.app`).

### 5. Final sync (critical)

1. Open the **server** project on Vercel → **Settings → Environment Variables**.
2. Set **`FRONTEND_URLS`** to include your **front-end** production URL (comma-separated with local if you want), e.g. `http://localhost:5173,https://your-app.vercel.app`, or set **`FRONTEND_URL`** / **`CLIENT_ORIGIN`** — all merge into one CORS list.
3. **Redeploy** the **server** so CORS picks up the real front-end origin.

### Variable map (cheat sheet)

| Where | Variable | Value |
| ----- | -------- | ----- |
| **Server (Vercel)** | `MONGODB_URI`, `JWT_SECRET`, Cloudinary vars | Secrets / Atlas |
| **Server (Vercel)** | **`FRONTEND_URLS`** and/or **`FRONTEND_URL`** / **`CLIENT_ORIGIN`** | Your **front-end** URL(s) — CORS (comma-separated) |
| **Client (Vercel)** | **`VITE_API_URL`** | Your **API** URL — fetch calls |

### If the two deployments “work” but not together

| Symptom | What to fix |
| ------- | ----------- |
| Network tab shows requests to **`https://your-frontend.vercel.app/api/...`** (404) | **`VITE_API_URL`** is missing or not applied. Set it on the **client** project to the **API** origin only (e.g. `https://your-api.vercel.app`, not `/api`). **Redeploy the client** — Vite reads env at **build** time. |
| Console: CORS / blocked by policy | On the **server** project, **`FRONTEND_URLS`** (or **`FRONTEND_URL`**) must include your **exact** front-end origin (`https://…vercel.app`). **Redeploy the server** after changing. For preview URLs, set **`ALLOW_VERCEL_PREVIEWS=true`** (or **`1`**) on the server. |
| Accidentally set `VITE_API_URL` to `…vercel.app/api` | Use the API **origin** only; the app already adds `/api` to paths. |
| **`/assets/index-*.css` 404** (styles missing) | The SPA rewrite must run **after** static files. `client/vercel.json` uses `{ "handle": "filesystem" }` then `index.html` fallback. Redeploy the **client** after pulling. |

---

More detail: **`client/README.md`** and **`server/README.md`**.
