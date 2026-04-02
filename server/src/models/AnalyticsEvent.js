const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    path: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", analyticsEventSchema);
