const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, default: null },
  sampleAnswer: { type: String, default: "" },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    /** multiple_choice = options + correctIndex; true_false = True/False options; essay = free text answers */
    quizType: { type: String, enum: ["multiple_choice", "true_false", "essay"], default: "multiple_choice" },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
