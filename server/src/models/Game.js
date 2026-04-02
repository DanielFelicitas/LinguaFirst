const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    gameType: {
      type: String,
      enum: [
        "match_pairs",
        "word_scramble",
        "sentence_correct",
        "describe_see",
        "word_search",
        "language_challenge",
      ],
      required: true,
    },
    /** match_pairs: { pairCount, vocabularyTag? }; word_scramble: { vocabularyTag?, answerSide, scrambleMode?, scramblePuzzles? }; sentence_correct: { items:[{ sentence, correct, explanation? }] }; describe_see: { items:[{ imageDataUrl?, prompt?, options[], correctIndex }] }; word_search: { vocabularyTag?, wordSearchCount? }; language_challenge: { questions:[{ prompt, options[], correctIndex, explanation? }] } */
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Game || mongoose.model("Game", gameSchema);
