const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      category,
      eventType,
      popularity,
      minRating,
      sort = "bestSelling",
      limit = 1200
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (eventType) query.eventType = eventType;
    if (popularity) query.popularity = popularity;
    if (minRating) query.rating = { $gte: Number(minRating) };

    let sortQuery = { totalBookings: -1 };
    if (sort === "topRated") sortQuery = { rating: -1 };
    if (sort === "newest") sortQuery = { createdAt: -1 };

    const data = await Product.find(query).sort(sortQuery).limit(Math.min(Number(limit), 2000));
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await Product.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
