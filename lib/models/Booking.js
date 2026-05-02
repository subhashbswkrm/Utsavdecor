const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    address: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    advanceAmount: { type: Number, default: 0 },
    paymentProvider: { type: String, enum: ["none", "razorpay", "stripe"], default: "none" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);