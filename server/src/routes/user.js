const express = require("express");
const Note = require("../models/Note");
const Progress = require("../models/Progress");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/notes", auth(true), async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ notes });
  } catch (e) {
    next(e);
  }
});

router.post("/notes", auth(true), async (req, res, next) => {
  try {
    const { title, body, lessonId } = req.body || {};
    const note = await Note.create({
      userId: req.user._id,
      title: title || "Untitled",
      body: body || "",
      lessonId: lessonId || undefined,
    });
    res.status(201).json({ note });
  } catch (e) {
    next(e);
  }
});

router.patch("/notes/:id", auth(true), async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    const { title, body, lessonId } = req.body || {};
    if (title !== undefined) note.title = title;
    if (body !== undefined) note.body = body;
    if (lessonId !== undefined) note.lessonId = lessonId || null;
    await note.save();
    res.json({ note });
  } catch (e) {
    next(e);
  }
});

router.delete("/notes/:id", auth(true), async (req, res, next) => {
  try {
    const r = await Note.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (r.deletedCount === 0) return res.status(404).json({ message: "Note not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/progress", auth(true), async (req, res, next) => {
  try {
    const items = await Progress.find({ userId: req.user._id }).lean();
    res.json({ progress: items });
  } catch (e) {
    next(e);
  }
});

router.post("/progress", auth(true), async (req, res, next) => {
  try {
    const { lessonId, started, completed, quizScore } = req.body || {};
    if (!lessonId) return res.status(400).json({ message: "lessonId required" });
    const doc = await Progress.findOneAndUpdate(
      { userId: req.user._id, lessonId },
      {
        $set: {
          ...(started !== undefined && { started: !!started }),
          ...(completed !== undefined && { completed: !!completed }),
          ...(quizScore !== undefined && { quizScore: Number(quizScore) }),
        },
      },
      { new: true, upsert: true }
    );
    res.json({ progress: doc });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
