const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const languagePageSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    definition: { type: String, default: "" },
    examples: [{ type: String }],
    categories: [categorySchema],
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    title: { type: String, required: true },
    /** Legacy markdown / plain text; for simple lessons mirrors first slide */
    content: { type: String, default: "" },
    /** Four-page flipbook: Naga → Rinconada → Filipino → English */
    languagePages: { type: [languagePageSchema], default: [] },
    /** simple lessons: ordered slides (falls back to content if empty) */
    simpleSlides: { type: [String], default: [] },
    /** flipbook = language flip flow; simple = multi-slide text in simpleSlides */
    lessonType: { type: String, enum: ["flipbook", "simple"], default: "flipbook" },
    order: { type: Number, default: 0 },
    slug: { type: String, required: true },
  },
  { timestamps: true }
);

lessonSchema.index({ moduleId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
