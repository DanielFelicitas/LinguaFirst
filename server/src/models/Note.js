const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Untitled" },
    body: { type: String, default: "" },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Note || mongoose.model("Note", noteSchema);
