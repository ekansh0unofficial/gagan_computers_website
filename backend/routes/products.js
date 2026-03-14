const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../data/db");

// ── Multer setup for image uploads ─────────────────────────
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/products ── list all (with optional search) ───
router.get("/", (req, res) => {
  const { q, category, sort } = req.query;
  let products = db.getProducts();

  // Search filter
  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    products = products.filter((p) => {
      const score =
        (p.name.toLowerCase().includes(query) ? 3 : 0) +
        (p.description.toLowerCase().includes(query) ? 2 : 0) +
        (p.category?.toLowerCase().includes(query) ? 1 : 0);
      p._searchScore = score;
      return score > 0;
    });
    products.sort((a, b) => b._searchScore - a._searchScore);
  }

  // Category filter
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }

  // Sort
  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") products.sort((a, b) => b.price - a.price);
  else if (sort === "newest") products.sort((a, b) => b.createdAt - a.createdAt);

  res.json({ success: true, products });
});

// ── GET /api/products/categories ── distinct categories ────
router.get("/categories", (req, res) => {
  const products = db.getProducts();
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  res.json({ success: true, categories: cats });
});

// ── GET /api/products/featured ── for recommender section ──
router.get("/featured", (req, res) => {
  const products = db.getProducts();
  // Featured = in-stock items sorted by "popularity" (views, shuffled as proxy)
  const featured = products
    .filter((p) => p.inStock !== false)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);
  res.json({ success: true, products: featured });
});

// ── GET /api/products/:id ── single product + increment view
router.get("/:id", (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  db.incrementViews(req.params.id);
  res.json({ success: true, product });
});

// ── POST /api/products ── create (shopkeeper upload) ───────
router.post("/", upload.single("image"), (req, res) => {
  const { name, price, description, category, inStock } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  const product = {
    id: Date.now().toString(),
    name: name.trim(),
    price: parseFloat(price),
    description: description?.trim() || "",
    category: category?.trim() || "General",
    inStock: inStock !== "false",
    image: req.file ? `/uploads/${req.file.filename}` : null,
    views: 0,
    createdAt: Date.now(),
  };

  db.addProduct(product);
  res.status(201).json({ success: true, product });
});

// ── PUT /api/products/:id ── update product ─────────────────
router.put("/:id", upload.single("image"), (req, res) => {
  const existing = db.getProduct(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Not found" });

  const { name, price, description, category, inStock } = req.body;
  const updates = {
    ...(name && { name: name.trim() }),
    ...(price && { price: parseFloat(price) }),
    ...(description !== undefined && { description: description.trim() }),
    ...(category && { category: category.trim() }),
    ...(inStock !== undefined && { inStock: inStock !== "false" }),
    ...(req.file && { image: `/uploads/${req.file.filename}` }),
  };

  const updated = db.updateProduct(req.params.id, updates);
  res.json({ success: true, product: updated });
});

// ── DELETE /api/products/:id ── remove product ──────────────
router.delete("/:id", (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true });
});

module.exports = router;
