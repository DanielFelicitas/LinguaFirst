const express = require("express");
const Note = require("../models/Note");
const Progress = require("../models/Progress");
const Quiz = require("../models/Quiz");
const EssaySubmission = require("../models/EssaySubmission");
const QuizSubmission = require("../models/QuizSubmission");
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

router.post("/quizzes/:quizId/essay-submissions", auth(true), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.quizType !== "essay") return res.status(400).json({ message: "This quiz is not an essay quiz" });

    const rawAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    if (rawAnswers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Answer count does not match quiz questions" });
    }
    const responses = quiz.questions.map((q, i) => {
      const answer = String(rawAnswers[i] ?? "").trim();
      if (!answer) throw new Error(`Question ${i + 1} needs an answer`);
      return {
        prompt: String(q.prompt || ""),
        answer,
        sampleAnswer: String(q.sampleAnswer || ""),
      };
    });

    const submission = await EssaySubmission.create({
      quizId: quiz._id,
      userId: req.user._id,
      responses,
    });
    const score = 0;
    const maxScore = quiz.questions.length;
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    await QuizSubmission.create({
      quizId: quiz._id,
      userId: req.user._id,
      score,
      maxScore,
      percent,
      submissionType: "essay",
    });
    res.status(201).json({ submission });
  } catch (e) {
    if (e instanceof Error && e.message.includes("needs an answer")) {
      return res.status(400).json({ message: e.message });
    }
    next(e);
  }
});

router.post("/quizzes/:quizId/submissions", auth(true), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.quizType === "essay") {
      return res.status(400).json({ message: "Use essay submission endpoint for essay quizzes" });
    }

    const score = Number(req.body?.score);
    const maxScore = Number(req.body?.maxScore);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore)) {
      return res.status(400).json({ message: "score and maxScore are required numbers" });
    }
    if (maxScore < 0 || score < 0 || score > maxScore) {
      return res.status(400).json({ message: "Invalid score values" });
    }
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const submission = await QuizSubmission.create({
      quizId: quiz._id,
      userId: req.user._id,
      score,
      maxScore,
      percent,
      submissionType: "objective",
    });
    res.status(201).json({ submission });
  } catch (e) {
    next(e);
  }
});

router.get("/quizzes/:quizId/essay-submissions/me", auth(true), async (req, res, next) => {
  try {
    const submission = await EssaySubmission.findOne({ quizId: req.params.quizId, userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    if (!submission) return res.status(404).json({ message: "No submission found" });
    res.json({ submission });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
