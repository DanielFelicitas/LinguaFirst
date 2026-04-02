const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    started: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    quizScore: { type: Number, default: null },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
