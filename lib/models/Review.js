const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, trim: true },
    eventType: { type: String, default: "", trim: true },
    isFeatured: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);