const mongoose = require("mongoose");

const MODULE_TYPES = ["grammar", "vocabulary", "conversation", "culture", "general"];

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true },
    moduleType: {
      type: String,
      enum: MODULE_TYPES,
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Module || mongoose.model("Module", moduleSchema);
