const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();

/** CORS: merge FRONTEND_URLS, FRONTEND_URL, CLIENT_ORIGIN (same pattern as Inventory Management System). */
function parseCorsOrigins() {
  const raw = [process.env.FRONTEND_URLS, process.env.FRONTEND_URL, process.env.CLIENT_ORIGIN]
    .filter(Boolean)
    .join(",");
  if (!raw.trim()) return null;
  const set = new Set();
  raw
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean)
    .forEach((o) => set.add(o));
  return set.size ? Array.from(set) : null;
}

const clientOrigins = parseCorsOrigins();
const allowVercelPreviews =
  String(process.env.ALLOW_VERCEL_PREVIEWS || "").toLowerCase() === "true" ||
  process.env.ALLOW_VERCEL_PREVIEWS === "1";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!clientOrigins || clientOrigins.length === 0) return callback(null, true);
      const normalized = origin.replace(/\/+$/, "");
      if (clientOrigins.includes(normalized)) return callback(null, true);
      if (allowVercelPreviews) {
        try {
          if (/\.vercel\.app$/i.test(new URL(origin).hostname)) return callback(null, true);
        } catch {
          /* ignore */
        }
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

/** Liveness — no MongoDB (Vercel / uptime checks). Must stay above connectDB middleware. */
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "linguafirst-api", health: "/api/health" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "linguafirst-api" });
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error(err);
    const missingUri = !process.env.MONGODB_URI;
    const message = missingUri
      ? "Database unavailable: set MONGODB_URI on the server (e.g. Vercel → Project → Settings → Environment Variables). Do not put MongoDB in VITE_* — that is frontend-only."
      : "Database unavailable: check MONGODB_URI value and that Atlas allows your deployment IP (0.0.0.0/0 for Vercel).";
    return res.status(503).json({ message });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", contentRoutes);
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

module.exports = app;
