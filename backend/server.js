require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const productRoutes = require("./routes/products");
const orderRoutes   = require("./routes/orders");
const configRoutes  = require("./routes/config");
const { requireAuth, authRouter } = require("./middleware/auth");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Core middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ── Auth ────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── Public routes ───────────────────────────────────────────
app.use("/api/config", configRoutes);
app.use("/api/orders", orderRoutes);

// ── Products — auth enforced for write methods only ─────────
app.use("/api/products", (req, res, next) => {
  const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];
  if (writeMethods.includes(req.method)) {
    return requireAuth(req, res, next);
  }
  next();
}, productRoutes);

// ── SPA routes — serve index.html for all known frontend paths
// FIX: Now that the frontend uses pathname routing (/admin, /checkout),
// these routes must be explicitly handled so a hard refresh or direct
// URL entry doesn't 404. The catch-all below handles unknown paths too.
const spaRoutes = ["admin", "checkout"];
spaRoutes.forEach(route => {
  app.get(`/${route}`, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  });
});

// ── Catch-all → SPA (also handles / home route) ────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Dukaan running on http://localhost:${PORT}`);
  console.log(`   Shop: ${process.env.SHOP_NAME || "Dukaan"}`);
  console.log(`   WhatsApp: ${process.env.WHATSAPP_NUMBER || "NOT SET"}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("⚠️  ADMIN_PASSWORD not set — defaulting to 'admin123'. Change in .env!");
  }
});