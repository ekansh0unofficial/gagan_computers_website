const express = require("express");
const router = express.Router();

// ── GET /api/config ── public shop config for frontend ─────
router.get("/", (req, res) => {
  res.json({
    shopName: process.env.SHOP_NAME || "Dukaan",
    tagline: process.env.SHOP_TAGLINE || "Your neighbourhood store, online.",
    whatsappNumber: process.env.WHATSAPP_NUMBER || null,
    upiId: process.env.UPI_ID || null,
    upiName: process.env.UPI_NAME || null,
  });
});

module.exports = router;
