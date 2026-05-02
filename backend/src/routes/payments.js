const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");

const router = express.Router();

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing in environment variables.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

router.get("/config", (_req, res) => {
  return res.json({
    success: true,
    data: {
      keyId: process.env.RAZORPAY_KEY_ID || ""
    }
  });
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", bookingId, notes = {} } = req.body;
    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: "Valid amount is required." });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: `booking_${Date.now()}`,
      notes
    });

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        advanceAmount: Number(amount),
        paymentProvider: "razorpay"
      });
    }

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      bookingId
    } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields." });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        status: "confirmed",
        paymentProvider: "razorpay"
      });
    }

    return res.json({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
