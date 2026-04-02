const mongoose = require("mongoose");

const vocabularyWordSchema = new mongoose.Schema(
  {
    bikol: { type: String, required: true },
    english: { type: String, required: true },
    example: { type: String, default: "" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VocabularyWord || mongoose.model("VocabularyWord", vocabularyWordSchema);
