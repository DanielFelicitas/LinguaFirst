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

/** Allow *.vercel.app when true/1, or when unset on Vercel (Preview deploys use a different hostname than Production). Opt out: ALLOW_VERCEL_PREVIEWS=false */
function isVercelRuntime() {
  return Boolean(
    (process.env.VERCEL != null && String(process.env.VERCEL) !== "") ||
    (process.env.VERCEL_ENV != null && String(process.env.VERCEL_ENV) !== "")
  );
}

function allowVercelPreviewOrigins() {
  const v = String(process.env.ALLOW_VERCEL_PREVIEWS ?? "").trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  // Default on Vercel (VERCEL or VERCEL_ENV is set in serverless — not only VERCEL=== "1")
  return isVercelRuntime();
}

const allowVercelPreviews = allowVercelPreviewOrigins();

/** Same rule as Inventory Management System: Origin ends with `.vercel.app` (after trimming a trailing slash). */
function isVercelPreviewOrigin(origin) {
  if (typeof origin !== "string") return false;
  return origin.replace(/\/+$/, "").endsWith(".vercel.app");
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!clientOrigins || clientOrigins.length === 0) return callback(null, true);
    const normalized = origin.replace(/\/+$/, "");
    if (clientOrigins.includes(normalized)) return callback(null, true);
    if (allowVercelPreviews && isVercelPreviewOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

/**
 * cors@2 calls `next()` when origin is denied, so OPTIONS can fall through without ACAO headers.
 * Answer Preview (*.vercel.app) preflights here when allowed by allowVercelPreviews.
 */
app.use((req, res, next) => {
  if (req.method !== "OPTIONS" || res.headersSent) return next();
  const origin = req.headers.origin;
  if (!origin || !allowVercelPreviews || !isVercelPreviewOrigin(origin)) return next();
  const o = origin.replace(/\/+$/, "");
  res.setHeader("Access-Control-Allow-Origin", o);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  const reqHdr = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    reqHdr || "Content-Type, Authorization"
  );
  res.setHeader("Vary", reqHdr ? "Origin, Access-Control-Request-Headers" : "Origin");
  return res.status(204).end();
});

app.use(express.json({ limit: "1mb" }));

/** Liveness — no MongoDB (Vercel / uptime checks). Must stay above connectDB middleware. */
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "linguafirst-api", health: "/api/health" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "linguafirst-api" });
});

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
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
