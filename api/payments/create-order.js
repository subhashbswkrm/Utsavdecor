const Razorpay = require('razorpay');
const prisma = require('../lib/db');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing in environment variables.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          advanceAmount: Number(amount),
          paymentProvider: "razorpay"
        }
      });
    }

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}