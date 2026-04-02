const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, getSecret } = require("../middleware/auth");

const router = express.Router();

function signToken(userId) {
  return jwt.sign({}, getSecret(), { subject: userId.toString(), expiresIn: "14d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const count = await User.countDocuments();
    const role = count === 0 ? "admin" : "user";

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      displayName: displayName || "",
      role,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/me", auth(true), (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      role: req.user.role,
    },
  });
});

module.exports = router;
