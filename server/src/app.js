const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();

/** Any browser origin may call the API (`Access-Control-Allow-Origin` mirrors the request). Protected routes still require JWT. */
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
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
