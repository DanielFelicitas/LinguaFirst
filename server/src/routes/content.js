const express = require("express");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const Game = require("../models/Game");
const VocabularyWord = require("../models/VocabularyWord");

const router = express.Router();

router.get("/modules", async (_req, res, next) => {
  try {
    const modules = await Module.find().sort({ order: 1, title: 1 }).lean();
    const lessons = await Lesson.find().sort({ order: 1 }).lean();
    const withLessons = modules.map((m) => ({
      ...m,
      lessons: lessons.filter((l) => l.moduleId.toString() === m._id.toString()),
    }));
    res.json({ modules: withLessons });
  } catch (e) {
    next(e);
  }
});

router.get("/lessons/:idOrSlug", async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const byId = await Lesson.findById(idOrSlug).populate("moduleId");
    if (byId) return res.json({ lesson: byId });
    const lesson = await Lesson.findOne({ slug: idOrSlug }).populate("moduleId");
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ lesson });
  } catch (e) {
    next(e);
  }
});

router.get("/quizzes", async (req, res, next) => {
  try {
    const { moduleId } = req.query;
    const q = moduleId ? { moduleId } : {};
    const quizzes = await Quiz.find(q).sort({ title: 1 }).lean();
    res.json({ quizzes });
  } catch (e) {
    next(e);
  }
});

router.get("/quizzes/:id", async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ quiz });
  } catch (e) {
    next(e);
  }
});

router.get("/vocabulary", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const { tag } = req.query;
    const filter = tag && String(tag).trim() ? { tags: String(tag).trim() } : {};
    const words = await VocabularyWord.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ words });
  } catch (e) {
    next(e);
  }
});

router.get("/games", async (_req, res, next) => {
  try {
    const games = await Game.find({ published: true }).sort({ order: 1, title: 1 }).lean();
    res.json({ games });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
