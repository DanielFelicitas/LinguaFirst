const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return s;
}

function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ message: "Unauthorized" });
      req.user = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, getSecret());
      const user = await User.findById(payload.sub).select("-passwordHash");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

module.exports = { auth, requireAdmin, getSecret };
