const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    answer: { type: String, required: true },
    sampleAnswer: { type: String, default: "" },
    /** Admin grading fields (optional until graded). */
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const essaySubmissionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    responses: { type: [responseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EssaySubmission || mongoose.model("EssaySubmission", essaySubmissionSchema);
