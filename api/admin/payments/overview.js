const prisma = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const [statusBuckets, revenueBuckets, recentPayments] = await Promise.all([
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.$queryRaw`
        SELECT
          SUM(CASE WHEN status IN ('confirmed', 'completed') THEN advance_amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status IN ('confirmed', 'completed') AND updated_at >= ${dayStart} THEN advance_amount ELSE 0 END) as today_revenue,
          SUM(CASE WHEN status IN ('confirmed', 'completed') AND updated_at >= ${weekStart} THEN advance_amount ELSE 0 END) as week_revenue
        FROM bookings
      `,
      prisma.booking.findMany({
        where: {
          status: { in: ['confirmed', 'completed'] },
          advanceAmount: { gt: 0 }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          name: true,
          phone: true,
          eventType: true,
          eventDate: true,
          advanceAmount: true,
          paymentProvider: true,
          status: true,
          updatedAt: true
        }
      })
    ]);

    const statusMap = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
    statusBuckets.forEach((entry) => {
      statusMap[entry.status] = entry._count.status;
    });

    const revenue = revenueBuckets[0] || {
      total_revenue: 0,
      today_revenue: 0,
      week_revenue: 0
    };

    return res.json({
      success: true,
      data: {
        totals: {
          bookings: Object.values(statusMap).reduce((a, b) => a + b, 0),
          pending: statusMap.pending,
          confirmed: statusMap.confirmed,
          completed: statusMap.completed,
          cancelled: statusMap.cancelled
        },
        revenue: {
          currency: "INR",
          total: parseFloat(revenue.total_revenue || 0),
          today: parseFloat(revenue.today_revenue || 0),
          last7Days: parseFloat(revenue.week_revenue || 0)
        },
        recentTransactions: recentPayments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}