const prisma = require('../lib/db');

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const limit = Number(req.query.limit || 20);
      const data = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200)
      });
      return res.json({ success: true, count: data.length, data });
    } else if (req.method === 'POST') {
      const { name, rating, reviewText, eventType } = req.body;
      if (!name || !rating || !reviewText) {
        return res.status(400).json({ success: false, message: "Missing required review fields" });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      }
      const review = await prisma.review.create({
        data: {
          name,
          rating: Number(rating),
          reviewText,
          eventType: eventType || ""
        }
      });
      return res.status(201).json({ success: true, data: review });
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}