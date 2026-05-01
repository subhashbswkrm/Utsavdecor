const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const data = await Booking.find().sort({ createdAt: -1 }).limit(500);
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, address, eventType, eventDate, productId } = req.body;
    if (!name || !phone || !address || !eventType || !eventDate) {
      return res.status(400).json({ success: false, message: "Missing required booking fields" });
    }
    const booking = await Booking.create({ name, phone, address, eventType, eventDate, productId: productId || null });
    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
