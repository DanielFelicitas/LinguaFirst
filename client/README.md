# LinguaFiRST — client

Vite + React + TypeScript + Tailwind CSS v4.

## Local development

```bash
cd client
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:5000` (run the server locally). Leave `VITE_API_URL` empty in `.env` for this.

## Environment

Copy `.env.example` to `.env` if needed:

- **`VITE_API_URL`** — Empty for local dev. For a **separate API deployment**, set to your API origin with **no trailing slash**, e.g. `https://your-api.vercel.app`.

## Build

```bash
npm run build
```

Output: `dist/`.

## Deploy on Vercel (client only)

1. Create a Vercel project with **Root Directory** set to `client` (or use this folder as the repo root).
2. Set **`VITE_API_URL`** to your deployed API URL.
3. `client/vercel.json` configures the Vite build and SPA rewrites for React Router.

## Static assets

Place files under `public/`; they are copied to `dist/` at build time.
