# LinguaFiRST — server

Express + MongoDB (Mongoose) + JWT + **Cloudinary** (admin image uploads).

## Local development

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and set:

- **`MONGODB_URI`** — MongoDB connection string  
- **`JWT_SECRET`** — long random string  
- **CORS** — the API allows **any browser origin** (`origin: true` in Express). You do not need `FRONTEND_URLS` or similar for CORS.  
- **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, **`CLOUDINARY_API_SECRET`** — use the same Cloudinary account as your Inventory Management System project (copy from that project’s Vercel env). Optional **`CLOUDINARY_URL`** is supported; if all three named vars are set, they override the URL line.  
- **`CLOUDINARY_FOLDER`** — optional; default **`ims_profiles`** (same root folder convention as IMS; override if you want a subfolder).

```bash
npm run dev
```

API listens on `http://localhost:5000` (or `PORT`).

## Admin image upload

`POST /api/admin/upload` (multipart field **`file`**, admin JWT required) uploads to Cloudinary and returns `{ url }`. Used by the admin “Describe what you see” game editor.

## Seed content

```bash
npm run seed
```

## Deploy on Vercel (API only)

1. Create a Vercel project with **Root Directory** `server`.  
2. Add the same environment variables as in `.env` (including Cloudinary).  
3. `server/vercel.json` + `server/api/index.js` expose the Express app as a serverless function.

### Troubleshooting

- **`503` with `Database unavailable`** — Add **`MONGODB_URI`** in Vercel → **Settings → Environment Variables** (Production + Preview), then **Redeploy**. In Atlas → **Network Access**, allow **`0.0.0.0/0`** so Vercel can connect.

- **`GET /` and `GET /api/health`** — Respond **without** MongoDB (used for uptime). If those work but other routes return 503, the problem is only MongoDB config.

- **`Cannot GET /`** — Open **`/api/health`** or **`/`** on your API URL; you should get JSON. If you still see plain “Cannot GET”, confirm **Root Directory** is **`server`** and redeploy.

## Accounts

The **first registered user** becomes **admin** and can use `/admin/content` and admin API routes.
