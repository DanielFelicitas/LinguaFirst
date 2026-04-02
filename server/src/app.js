const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error(err);
    return res.status(503).json({ message: "Database unavailable. Set MONGODB_URI." });
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
