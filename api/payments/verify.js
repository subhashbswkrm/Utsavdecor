const crypto = require('crypto');
const prisma = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "confirmed",
          paymentProvider: "razorpay"
        }
      });
    }

    return res.json({ success: true, message: "Payment verified successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}