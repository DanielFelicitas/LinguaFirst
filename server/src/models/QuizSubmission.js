const mongoose = require("mongoose");

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    percent: { type: Number, required: true, min: 0, max: 100 },
    submissionType: {
      type: String,
      enum: ["objective", "essay"],
      default: "objective",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.QuizSubmission || mongoose.model("QuizSubmission", quizSubmissionSchema);
