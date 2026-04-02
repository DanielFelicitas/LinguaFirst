# LinguaFiRST

MERN stack app for **Bikol ↔ English** learning: modules and lessons, quizzes, vocabulary, a matching game, notes, progress, and signed-in analytics.

## Layout

- **`client/`** — Vite + React + TypeScript + Tailwind CSS v4
- **`server/`** — Express + MongoDB (Mongoose) + JWT
- **`api/`** — Vercel serverless entry that re-exports the Express app

## Local development

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, and optionally `CLIENT_ORIGIN=http://localhost:5173`.

2. Install and run both apps:

   ```bash
   npm install
   npm run dev
   ```

   The Vite dev server proxies `/api` to `http://localhost:5000`.

3. (Optional) Seed demo content once the database is empty:

   ```bash
   npm run seed --workspace server
   ```

## Accounts

- **First registered user** is assigned the **admin** role and can manage content via the **`/api/admin/*`** routes (Bearer token).
- Other users are regular learners.

## Analytics

When a user is signed in, the client sends `POST /api/analytics` on navigation (page views). Events are stored with `userId` for product insights.

## Deploy on Vercel

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or any MongoDB URI).

2. In the Vercel project **Settings → Environment Variables**, add:

   - `MONGODB_URI` — connection string  
   - `JWT_SECRET` — long random string  
   - Optional: `CLIENT_ORIGIN` — your production site URL (for CORS if the API is called from another origin)

3. Connect the repo and deploy. Root **`vercel.json`** builds the client and rewrites `/api/*` to the serverless API.

4. After deploy, register once (or run seed from a machine with `MONGODB_URI` set) so the app has content.

## Admin API (sketch)

All routes require `Authorization: Bearer <token>` and admin role.

- `POST /api/admin/modules` — `{ title, slug, description?, order? }`
- `POST /api/admin/lessons` — `{ moduleId, title, slug, content?, order? }`
- `POST /api/admin/quizzes` — `{ title, moduleId?, questions: [{ prompt, options[], correctIndex }] }`
- `POST /api/admin/vocabulary` — `{ bikol, english, example?, tags? }`

See `server/src/routes/admin.js` for PATCH/DELETE routes.
