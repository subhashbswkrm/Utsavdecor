const express = require("express");
const Review = require("../models/Review");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const data = await Review.find().sort({ createdAt: -1 }).limit(Math.min(limit, 200));
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, rating, reviewText, eventType } = req.body;
    if (!name || !rating || !reviewText) {
      return res.status(400).json({ success: false, message: "Missing required review fields" });
    }
    const review = await Review.create({ name, rating, reviewText, eventType: eventType || "" });
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
