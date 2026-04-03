/**
 * Vercel serverless entry — deploy with Root Directory = `server`.
 *
 * IMPORTANT: Use optional catch-all `[[...path]].js` so `/api/health`, `/api/modules`, etc.
 * all hit this file. A plain `api/index.js` only handles `/api` and other `/api/*` paths
 * 404 (Vercel looks for `api/health.js`, `api/modules.js`, …).
 *
 * Env: Vercel → Project → Environment Variables (MONGODB_URI, JWT_SECRET, …).
 */
if (!process.env.VERCEL) {
  require("dotenv").config({
    path: require("path").join(__dirname, "..", ".env"),
  });
}

const serverless = require("serverless-http");
const app = require("../src/app");

const handler = serverless(app, {
  binary: ["multipart/form-data", "image/*", "application/octet-stream"],
});

module.exports = async (req, res) => {
  try {
    return await handler(req, res);
  } catch (err) {
    console.error("serverless handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err?.message || "Server error" });
    }
  }
};
