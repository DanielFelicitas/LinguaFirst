const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    /** multiple_choice = 4 options; true_false = options stored as True/False */
    quizType: { type: String, enum: ["multiple_choice", "true_false"], default: "multiple_choice" },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
