const express = require("express");
const router = express.Router();

// ── POST /api/orders/whatsapp ── generate WhatsApp order ───
// Receives cart items, returns a WhatsApp deep-link URL
router.post("/whatsapp", (req, res) => {
  const { items, customerName, customerNote } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const waNumber = process.env.WHATSAPP_NUMBER;
  if (!waNumber) {
    return res.status(500).json({ success: false, message: "WhatsApp not configured on server" });
  }

  // ── Build message ──────────────────────────────────────
  const shopName = process.env.SHOP_NAME || "Dukaan";
  const orderRef = "ORD-" + Date.now().toString().slice(-6);

  let total = 0;
  const itemLines = items.map((item) => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    return `  • ${item.name} × ${item.quantity} = ₹${lineTotal.toFixed(2)}`;
  });

  const lines = [
    `🛍️ *New Order from ${shopName}*`,
    `Order Ref: ${orderRef}`,
    ``,
    `*Items:*`,
    ...itemLines,
    ``,
    `*Total: ₹${total.toFixed(2)}*`,
  ];

  if (customerName) lines.push(``, `Customer: ${customerName}`);
  if (customerNote) lines.push(`Note: ${customerNote}`);

  lines.push(``, `Please confirm this order. Thank you! 🙏`);

  const message = lines.join("\n");
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${waNumber}?text=${encodedMsg}`;

  res.json({
    success: true,
    orderRef,
    total,
    whatsappUrl: waUrl,
    upiId: process.env.UPI_ID || null,
    upiName: process.env.UPI_NAME || null,
  });
});

module.exports = router;
