const express = require("express");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/", auth(true), async (req, res, next) => {
  try {
    const { name, path: p, meta } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "name is required" });
    }
    const ev = await AnalyticsEvent.create({
      userId: req.user._id,
      name,
      path: typeof p === "string" ? p : "",
      meta: meta && typeof meta === "object" ? meta : {},
    });
    res.status(201).json({ id: ev._id });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
