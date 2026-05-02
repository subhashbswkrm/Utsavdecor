const prisma = require('../lib/db');

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500
      });
      return res.json({ success: true, count: data.length, data });
    } else if (req.method === 'POST') {
      const { name, phone, address, eventType, eventDate, productId } = req.body;
      if (!name || !phone || !address || !eventType || !eventDate) {
        return res.status(400).json({ success: false, message: "Missing required booking fields" });
      }
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Invalid phone number" });
      }
      const booking = await prisma.booking.create({
        data: {
          name,
          phone,
          address,
          eventType,
          eventDate: new Date(eventDate),
          productId: productId || null
        }
      });
      return res.status(201).json({ success: true, data: booking });
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}