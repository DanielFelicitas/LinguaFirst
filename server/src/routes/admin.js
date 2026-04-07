const express = require("express");
const multer = require("multer");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const EssaySubmission = require("../models/EssaySubmission");
const VocabularyWord = require("../models/VocabularyWord");
const Game = require("../models/Game");
const { auth, requireAdmin } = require("../middleware/auth");
const { cloudinary, ensureConfigured } = require("../lib/cloudinary");

const router = express.Router();
router.use(auth(true), requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const MAX_SIMPLE_SLIDES = 40;
const GAME_TYPES = [
  "match_pairs",
  "word_scramble",
  "sentence_correct",
  "describe_see",
  "language_challenge",
  "word_search",
];

function normalizeQuizType(quizType) {
  if (quizType === "true_false") return "true_false";
  if (quizType === "essay") return "essay";
  return "multiple_choice";
}

function validateQuizQuestions(questions, qt) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "title and questions[] required";
  }
  for (const q of questions) {
    if (!q?.prompt || !String(q.prompt).trim()) return "Each question needs a prompt";
    if (qt === "essay") continue;
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return "Each question needs at least 2 options";
    }
    if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return "Each question needs valid correctIndex";
    }
    if (qt === "true_false" && q.options.length !== 2) {
      return "True/false quizzes need exactly 2 options per question";
    }
  }
  return null;
}

function normalizeSimpleSlidesPayload(body, lessonType) {
  if (lessonType !== "simple") return [];
  const { simpleSlides, content } = body || {};
  if (Array.isArray(simpleSlides) && simpleSlides.length > 0) {
    return simpleSlides.slice(0, MAX_SIMPLE_SLIDES).map((s) => String(s ?? ""));
  }
  return [String(content ?? "")];
}

const MODULE_TYPES = new Set(["grammar", "vocabulary", "conversation", "culture", "general"]);

router.post("/modules", async (req, res, next) => {
  try {
    const { title, description, order, slug, moduleType } = req.body || {};
    if (!title || !slug) return res.status(400).json({ message: "title and slug required" });
    const mt = MODULE_TYPES.has(moduleType) ? moduleType : "general";
    const mod = await Module.create({
      title,
      description: description || "",
      order: order ?? 0,
      slug: String(slug).toLowerCase().replace(/\s+/g, "-"),
      moduleType: mt,
    });
    res.status(201).json({ module: mod });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Slug already exists" });
    next(e);
  }
});

router.patch("/modules/:id", async (req, res, next) => {
  try {
    const { title, description, order, slug, moduleType } = req.body || {};
    const updates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
      ...(slug !== undefined && { slug: String(slug).toLowerCase().replace(/\s+/g, "-") }),
    };
    if (moduleType !== undefined) {
      updates.moduleType = MODULE_TYPES.has(moduleType) ? moduleType : "general";
    }
    const mod = await Module.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!mod) return res.status(404).json({ message: "Module not found" });
    res.json({ module: mod });
  } catch (e) {
    next(e);
  }
});

router.delete("/modules/:id", async (req, res, next) => {
  try {
    await Lesson.deleteMany({ moduleId: req.params.id });
    await Quiz.deleteMany({ moduleId: req.params.id });
    const r = await Module.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Module not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/lessons", async (req, res, next) => {
  try {
    const { moduleId, title, content, languagePages, lessonType, order, slug } = req.body || {};
    if (!moduleId || !title || !slug) {
      return res.status(400).json({ message: "moduleId, title, slug required" });
    }
    const lt = lessonType === "simple" ? "simple" : "flipbook";
    const simpleSlides = normalizeSimpleSlidesPayload(req.body, lt);
    const lesson = await Lesson.create({
      moduleId,
      title,
      content: lt === "simple" ? simpleSlides[0] || "" : content || "",
      lessonType: lt,
      simpleSlides: lt === "simple" ? simpleSlides : [],
      ...(lt === "flipbook" && Array.isArray(languagePages) && { languagePages }),
      ...(lt === "simple" && { languagePages: [] }),
      order: order ?? 0,
      slug: String(slug).toLowerCase().replace(/\s+/g, "-"),
    });
    res.status(201).json({ lesson });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Slug unique per module" });
    next(e);
  }
});

router.patch("/lessons/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const { title, content, languagePages, lessonType, order, slug, moduleId } = body;
    const existing = await Lesson.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Lesson not found" });

    if (lessonType === undefined) {
      return res.status(400).json({ message: "lessonType required" });
    }
    const lt = lessonType === "simple" ? "simple" : "flipbook";

    const patch = {
      ...(moduleId !== undefined && { moduleId }),
      ...(title !== undefined && { title }),
      ...(order !== undefined && { order }),
      ...(slug !== undefined && { slug: String(slug).toLowerCase().replace(/\s+/g, "-") }),
      lessonType: lt,
    };

    if (lt === "simple") {
      const slides = normalizeSimpleSlidesPayload(body, "simple");
      patch.content = slides[0] || "";
      patch.simpleSlides = slides;
      patch.languagePages = [];
    } else {
      patch.simpleSlides = [];
      patch.languagePages = Array.isArray(languagePages) ? languagePages : [];
      patch.content = content || "";
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ lesson });
  } catch (e) {
    next(e);
  }
});

router.delete("/lessons/:id", async (req, res, next) => {
  try {
    const r = await Lesson.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Lesson not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/quizzes", async (req, res, next) => {
  try {
    const { title, moduleId, questions, quizType } = req.body || {};
    if (!title) return res.status(400).json({ message: "title and questions[] required" });
    const qt = normalizeQuizType(quizType);
    const quizErr = validateQuizQuestions(questions, qt);
    if (quizErr) return res.status(400).json({ message: quizErr });
    const quiz = await Quiz.create({
      title,
      moduleId: moduleId || undefined,
      quizType: qt,
      questions,
    });
    res.status(201).json({ quiz });
  } catch (e) {
    next(e);
  }
});

router.patch("/quizzes/:id", async (req, res, next) => {
  try {
    const { title, moduleId, questions, quizType } = req.body || {};
    const existing = await Quiz.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Quiz not found" });
    const qt = normalizeQuizType(quizType !== undefined ? quizType : existing.quizType);
    if (questions !== undefined) {
      const quizErr = validateQuizQuestions(questions, qt);
      if (quizErr) return res.status(400).json({ message: quizErr });
    }
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(moduleId !== undefined && { moduleId }),
        ...(questions !== undefined && { questions }),
        ...(quizType !== undefined && { quizType: qt }),
      },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ quiz });
  } catch (e) {
    next(e);
  }
});

router.delete("/quizzes/:id", async (req, res, next) => {
  try {
    const r = await Quiz.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Quiz not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/essay-submissions", async (req, res, next) => {
  try {
    const filter = req.query.quizId ? { quizId: req.query.quizId } : {};
    const submissions = await EssaySubmission.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "displayName email")
      .populate("quizId", "title")
      .lean();
    res.json({ submissions });
  } catch (e) {
    next(e);
  }
});

router.delete("/essay-submissions/:id", async (req, res, next) => {
  try {
    const r = await EssaySubmission.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Submission not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/essay-submissions", async (req, res, next) => {
  try {
    const filter = req.query.quizId ? { quizId: req.query.quizId } : {};
    const r = await EssaySubmission.deleteMany(filter);
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (e) {
    next(e);
  }
});

router.patch("/essay-submissions/:id/grade", async (req, res, next) => {
  try {
    const submission = await EssaySubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const grades = Array.isArray(req.body?.grades) ? req.body.grades : [];
    if (grades.length !== submission.responses.length) {
      return res.status(400).json({ message: "Grade count does not match responses" });
    }

    submission.responses = submission.responses.map((r, i) => {
      const g = grades[i] || {};
      const score = g.score === null || g.score === undefined || g.score === "" ? null : Number(g.score);
      const maxScore = g.maxScore === null || g.maxScore === undefined || g.maxScore === "" ? null : Number(g.maxScore);
      if (score !== null && !Number.isFinite(score)) throw new Error(`Invalid score for question ${i + 1}`);
      if (maxScore !== null && !Number.isFinite(maxScore)) throw new Error(`Invalid maxScore for question ${i + 1}`);
      if (score !== null && score < 0) throw new Error(`Score must be >= 0 for question ${i + 1}`);
      if (maxScore !== null && maxScore < 0) throw new Error(`Max score must be >= 0 for question ${i + 1}`);
      if (score !== null && maxScore !== null && score > maxScore) {
        throw new Error(`Score cannot exceed max score for question ${i + 1}`);
      }
      return {
        ...r.toObject(),
        score,
        maxScore,
        feedback: String(g.feedback || ""),
      };
    });

    await submission.save();
    res.json({ submission: submission.toObject() });
  } catch (e) {
    if (e instanceof Error && (e.message.startsWith("Invalid") || e.message.includes("question"))) {
      return res.status(400).json({ message: e.message });
    }
    next(e);
  }
});

router.post("/vocabulary", async (req, res, next) => {
  try {
    const { bikol, filipino, english, example, tags } = req.body || {};
    if (!bikol || !filipino || !english) {
      return res.status(400).json({ message: "bikol, filipino and english required" });
    }
    const word = await VocabularyWord.create({
      bikol,
      filipino,
      english,
      example: example || "",
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json({ word });
  } catch (e) {
    next(e);
  }
});

router.patch("/vocabulary/:id", async (req, res, next) => {
  try {
    const { bikol, filipino, english, example, tags } = req.body || {};
    const word = await VocabularyWord.findByIdAndUpdate(
      req.params.id,
      {
        ...(bikol !== undefined && { bikol }),
        ...(filipino !== undefined && { filipino }),
        ...(english !== undefined && { english }),
        ...(example !== undefined && { example }),
        ...(tags !== undefined && { tags }),
      },
      { new: true }
    );
    if (!word) return res.status(404).json({ message: "Word not found" });
    res.json({ word });
  } catch (e) {
    next(e);
  }
});

router.delete("/vocabulary/:id", async (req, res, next) => {
  try {
    const r = await VocabularyWord.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Word not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/games", async (_req, res, next) => {
  try {
    const games = await Game.find().sort({ order: 1, title: 1 }).lean();
    res.json({ games });
  } catch (e) {
    next(e);
  }
});

router.post("/games", async (req, res, next) => {
  try {
    const { title, description, order, gameType, config, published } = req.body || {};
    if (!title || !gameType) {
      return res.status(400).json({ message: "title and gameType required" });
    }
    if (!GAME_TYPES.includes(gameType)) {
      return res.status(400).json({ message: "invalid gameType" });
    }
    if (gameType === "language_challenge") {
      const questions = config && Array.isArray(config.questions) ? config.questions : [];
      if (questions.length === 0) {
        return res.status(400).json({ message: "language challenge needs at least one question" });
      }
      for (const q of questions) {
        if (!q || !q.prompt || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: "each challenge question needs prompt and >=2 options" });
        }
        if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          return res.status(400).json({ message: "each challenge question needs a valid correctIndex" });
        }
      }
    }
    if (gameType === "sentence_correct") {
      const items = config && Array.isArray(config.items) ? config.items : [];
      if (items.length === 0) return res.status(400).json({ message: "sentence game needs at least one item" });
      for (const it of items) {
        if (!it || !String(it.sentence || "").trim()) {
          return res.status(400).json({ message: "each sentence item needs a sentence" });
        }
        if (typeof it.correct !== "boolean") {
          return res.status(400).json({ message: "each sentence item needs correct: true/false" });
        }
      }
    }
    if (gameType === "describe_see") {
      const items = config && Array.isArray(config.items) ? config.items : [];
      if (items.length === 0) return res.status(400).json({ message: "describe game needs at least one item" });
      for (const it of items) {
        const options = Array.isArray(it?.options) ? it.options : [];
        if (!it || options.length < 2) {
          return res.status(400).json({ message: "each describe item needs >=2 options" });
        }
        if (typeof it.correctIndex !== "number" || it.correctIndex < 0 || it.correctIndex >= options.length) {
          return res.status(400).json({ message: "each describe item needs a valid correctIndex" });
        }
        if (!String(it.imageDataUrl || "").trim() && !String(it.prompt || "").trim()) {
          return res.status(400).json({ message: "each describe item needs imageDataUrl or prompt" });
        }
      }
    }
    if (gameType === "word_scramble") {
      const mode = config?.scrambleMode === "custom" ? "custom" : "vocabulary";
      if (mode === "custom") {
        const puzzles = Array.isArray(config?.scramblePuzzles) ? config.scramblePuzzles : [];
        if (puzzles.length === 0) {
          return res.status(400).json({ message: "custom scramble needs at least one puzzle" });
        }
        for (const p of puzzles) {
          if (!p || !String(p.letters || "").trim() || !String(p.answer || "").trim()) {
            return res.status(400).json({ message: "each custom scramble puzzle needs letters and answer" });
          }
        }
      }
    }
    const game = await Game.create({
      title,
      description: description || "",
      order: order ?? 0,
      gameType,
      config: config && typeof config === "object" ? config : {},
      published: published !== false,
    });
    res.status(201).json({ game });
  } catch (e) {
    next(e);
  }
});

router.patch("/games/:id", async (req, res, next) => {
  try {
    const { title, description, order, gameType, config, published } = req.body || {};
    if (gameType !== undefined && !GAME_TYPES.includes(gameType)) {
      return res.status(400).json({ message: "invalid gameType" });
    }
    if (gameType === "language_challenge" || (gameType === undefined && config?.questions)) {
      const questions = config && Array.isArray(config.questions) ? config.questions : [];
      if (questions.length === 0) {
        return res.status(400).json({ message: "language challenge needs at least one question" });
      }
      for (const q of questions) {
        if (!q || !q.prompt || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: "each challenge question needs prompt and >=2 options" });
        }
        if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          return res.status(400).json({ message: "each challenge question needs a valid correctIndex" });
        }
      }
    }
    if (gameType === "sentence_correct" || (gameType === undefined && Array.isArray(config?.items) && config?.items?.[0]?.sentence)) {
      const items = config && Array.isArray(config.items) ? config.items : [];
      if (items.length === 0) return res.status(400).json({ message: "sentence game needs at least one item" });
      for (const it of items) {
        if (!it || !String(it.sentence || "").trim()) {
          return res.status(400).json({ message: "each sentence item needs a sentence" });
        }
        if (typeof it.correct !== "boolean") {
          return res.status(400).json({ message: "each sentence item needs correct: true/false" });
        }
      }
    }
    if (gameType === "describe_see" || (gameType === undefined && Array.isArray(config?.items) && (config?.items?.[0]?.options || config?.items?.[0]?.imageDataUrl))) {
      const items = config && Array.isArray(config.items) ? config.items : [];
      if (items.length === 0) return res.status(400).json({ message: "describe game needs at least one item" });
      for (const it of items) {
        const options = Array.isArray(it?.options) ? it.options : [];
        if (!it || options.length < 2) {
          return res.status(400).json({ message: "each describe item needs >=2 options" });
        }
        if (typeof it.correctIndex !== "number" || it.correctIndex < 0 || it.correctIndex >= options.length) {
          return res.status(400).json({ message: "each describe item needs a valid correctIndex" });
        }
        if (!String(it.imageDataUrl || "").trim() && !String(it.prompt || "").trim()) {
          return res.status(400).json({ message: "each describe item needs imageDataUrl or prompt" });
        }
      }
    }
    if (gameType === "word_scramble" || (gameType === undefined && config?.scrambleMode === "custom")) {
      const mode = config?.scrambleMode === "custom" ? "custom" : "vocabulary";
      if (mode === "custom") {
        const puzzles = Array.isArray(config?.scramblePuzzles) ? config.scramblePuzzles : [];
        if (puzzles.length === 0) {
          return res.status(400).json({ message: "custom scramble needs at least one puzzle" });
        }
        for (const p of puzzles) {
          if (!p || !String(p.letters || "").trim() || !String(p.answer || "").trim()) {
            return res.status(400).json({ message: "each custom scramble puzzle needs letters and answer" });
          }
        }
      }
    }
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(gameType !== undefined && { gameType }),
        ...(config !== undefined && { config }),
        ...(published !== undefined && { published: !!published }),
      },
      { new: true }
    );
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json({ game });
  } catch (e) {
    next(e);
  }
});

router.delete("/games/:id", async (req, res, next) => {
  try {
    const r = await Game.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Game not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/games", async (_req, res, next) => {
  try {
    await Game.deleteMany({});
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Image upload for admin (e.g. Describe game). Stores in Cloudinary under CLOUDINARY_FOLDER. */
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large (max 5MB)" });
      }
      return next(err);
    }
    try {
      ensureConfigured();
      if (!req.file?.buffer) {
        return res.status(400).json({ message: "file is required (multipart field name: file)" });
      }
      const folder = (process.env.CLOUDINARY_FOLDER || "ims_profiles").replace(/^\/+|\/+$/g, "");
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: "auto",
      });
      res.json({ url: result.secure_url });
    } catch (e) {
      next(e);
    }
  });
});

module.exports = router;
