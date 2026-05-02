const prisma = require('../../../lib/db');

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'PUT') {
      const product = await prisma.product.update({
        where: { id },
        data: req.body
      });
      return res.json({ success: true, data: product });
    } else if (req.method === 'DELETE') {
      await prisma.product.delete({
        where: { id }
      });
      return res.json({ success: true, message: "Product deleted" });
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
}