const prisma = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      category,
      eventType,
      popularity,
      minRating,
      sort = "bestSelling",
      limit = 1200
    } = req.query;

    const where = {};
    if (category) where.category = category;
    if (eventType) where.eventType = eventType;
    if (popularity) where.popularity = popularity;
    if (minRating) where.rating = { gte: parseFloat(minRating) };

    let orderBy = { totalBookings: 'desc' };
    if (sort === "topRated") orderBy = { rating: 'desc' };
    if (sort === "newest") orderBy = { createdAt: 'desc' };

    const data = await prisma.product.findMany({
      where,
      orderBy,
      take: Math.min(Number(limit), 2000)
    });
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}