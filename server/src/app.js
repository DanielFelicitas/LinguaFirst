const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();

const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "1" || process.env.ALLOW_VERCEL_PREVIEWS === "true";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!clientOrigins || clientOrigins.length === 0) return callback(null, true);
      if (clientOrigins.includes(origin)) return callback(null, true);
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "linguafirst" });
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
