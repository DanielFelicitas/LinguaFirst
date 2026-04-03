# LinguaFiRST

| Folder | Role |
| ------ | ---- |
| **`client/`** | Vite + React |
| **`server/`** | Express API + MongoDB |

## MERN split deploy on Vercel

The API uses **open CORS** (any browser origin). You only need **`VITE_API_URL`** on the client and MongoDB/JWT (and Cloudinary if used) on the server — no **`FRONTEND_URLS`** step. **Cloudinary** env names match **Inventory Management System** (trio preferred over **`CLOUDINARY_URL`**). LinguaFiRST uses **`serverless-http`** + **`api/index.js`** on the API.

## MERN split deploy on Vercel (tutorial flow)

Do **not** commit `.env` files (see `.gitignore`). Use `.env.example` as a template.

### 1. Environment preparation (before / after Git)

- Keep secrets out of Git: `server/.env`, `client/.env` are ignored.
- **Local dev:** `VITE_API_URL` empty in `client/.env`; API runs on port **5000** (server), Vite on **5173** (client). Optional: `API_PROXY_TARGET` in `client/.env` if your API is not on `localhost:5000`.

### 2. Vercel config files (already in repo)

- **`server/vercel.json`** — rewrites traffic to the serverless API (`api/index.js`).
- **`client/vercel.json`** — Vite build + SPA fallback for React Router.

### 3. Deploy the **back-end** first (Vercel project for `server/`)

1. New Vercel project → **Root Directory** = **`server`**.
2. Environment variables (minimum): `MONGODB_URI`, `JWT_SECRET`; optional `CLOUDINARY_*` for admin uploads.
3. Deploy. Copy the **production URL** of the API (e.g. `https://your-api.vercel.app`).

### 4. Deploy the **front-end** (second Vercel project for `client/`)

1. New Vercel project → **Root Directory** = **`client`** (same repo).
2. **`VITE_API_URL`** = your **API** URL from step 3, **no trailing slash** (e.g. `https://your-api.vercel.app`).
3. Deploy.

### Variable map (cheat sheet)

| Where | Variable | Value |
| ----- | -------- | ----- |
| **Server (Vercel)** | `MONGODB_URI`, `JWT_SECRET`, Cloudinary vars | Secrets / Atlas |
| **Client (Vercel)** | **`VITE_API_URL`** | Your **API** URL — fetch calls |

### If the two deployments “work” but not together

| Symptom | What to fix |
| ------- | ----------- |
| Network tab shows requests to **`https://your-frontend.vercel.app/api/...`** (404) | **`VITE_API_URL`** is missing or not applied. Set it on the **client** project to the **API** origin only. **Redeploy the client** — Vite reads env at **build** time. |
| Accidentally set `VITE_API_URL` to `…vercel.app/api` | Use the API **origin** only; paths already include `/api`. |
| **`/assets/index-*.css` 404** (styles missing) | `client/vercel.json` uses `{ "handle": "filesystem" }` then `index.html` fallback. Redeploy the **client**. |

---

More detail: **`client/README.md`** and **`server/README.md`**.
