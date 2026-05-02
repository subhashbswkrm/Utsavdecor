export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  return res.json({
    success: true,
    data: {
      keyId: process.env.RAZORPAY_KEY_ID || ""
    }
  });
}