const express = require("express");
const Product = require("../models/Product");
const Booking = require("../models/Booking");

const router = express.Router();

// In production, protect with JWT auth middleware.
router.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/payments/overview", async (_req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const [statusBuckets, revenueBuckets, recentPayments] = await Promise.all([
      Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $in: ["$status", ["confirmed", "completed"]] }, "$advanceAmount", 0]
              }
            },
            todayRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", ["confirmed", "completed"]] },
                      { $gte: ["$updatedAt", dayStart] }
                    ]
                  },
                  "$advanceAmount",
                  0
                ]
              }
            },
            weekRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", ["confirmed", "completed"]] },
                      { $gte: ["$updatedAt", weekStart] }
                    ]
                  },
                  "$advanceAmount",
                  0
                ]
              }
            }
          }
        }
      ]),
      Booking.find({
        status: { $in: ["confirmed", "completed"] },
        advanceAmount: { $gt: 0 }
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("name phone eventType eventDate advanceAmount paymentProvider status updatedAt")
    ]);

    const statusMap = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
    statusBuckets.forEach((entry) => {
      if (entry && entry._id && Object.prototype.hasOwnProperty.call(statusMap, entry._id)) {
        statusMap[entry._id] = entry.count;
      }
    });

    const revenue = revenueBuckets[0] || {
      totalRevenue: 0,
      todayRevenue: 0,
      weekRevenue: 0
    };

    return res.json({
      success: true,
      data: {
        totals: {
          bookings: statusMap.pending + statusMap.confirmed + statusMap.completed + statusMap.cancelled,
          pending: statusMap.pending,
          confirmed: statusMap.confirmed,
          completed: statusMap.completed,
          cancelled: statusMap.cancelled
        },
        revenue: {
          currency: "INR",
          total: revenue.totalRevenue || 0,
          today: revenue.todayRevenue || 0,
          last7Days: revenue.weekRevenue || 0
        },
        recentTransactions: recentPayments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
