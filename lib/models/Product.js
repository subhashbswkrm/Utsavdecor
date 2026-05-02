const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Puja Decorations",
        "Wedding Stage Decoration",
        "Birthday Decoration",
        "Festive Lighting",
        "Floral Decoration"
      ]
    },
    eventType: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priceMin: { type: Number, required: true, min: 999 },
    priceMax: { type: Number, required: true, min: 1000 },
    rating: { type: Number, default: 4, min: 4, max: 5 },
    popularity: { type: String, enum: ["high", "medium", "new"], default: "medium" },
    totalBookings: { type: Number, default: 0 },
    isBestSelling: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);