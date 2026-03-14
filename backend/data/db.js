/**
 * db.js — Lightweight JSON-based data store
 *
 * For small businesses, a JSON file is perfectly sufficient.
 * To upgrade to a real DB later, just replace these functions
 * with Postgres/MongoDB queries — the interface stays the same.
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "products.json");

// ── Helpers ─────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = getSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { products: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Public API ───────────────────────────────────────────────
function getProducts() {
  return readDB().products;
}

function getProduct(id) {
  return readDB().products.find((p) => p.id === id) || null;
}

function addProduct(product) {
  const data = readDB();
  data.products.push(product);
  writeDB(data);
  return product;
}

function updateProduct(id, updates) {
  const data = readDB();
  const idx = data.products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.products[idx] = { ...data.products[idx], ...updates };
  writeDB(data);
  return data.products[idx];
}

function deleteProduct(id) {
  const data = readDB();
  const idx = data.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  data.products.splice(idx, 1);
  writeDB(data);
  return true;
}

function incrementViews(id) {
  const data = readDB();
  const idx = data.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    data.products[idx].views = (data.products[idx].views || 0) + 1;
    writeDB(data);
  }
}

// ── Seed Data — replace with your real products ─────────────
function getSeedData() {
  return {
    products: [
      {
        id: "1",
        name: "boAt Rockerz 450 Bluetooth Headphones",
        price: 1299,
        description: "40mm dynamic drivers, 15-hour battery, foldable design. Deep bass with Super Extra Bass mode. Compatible with all Bluetooth devices.",
        category: "Audio",
        inStock: true,
        image: null,
        views: 84,
        createdAt: Date.now() - 86400000 * 12,
      },
      {
        id: "2",
        name: "Redmi 10C – 4GB RAM / 128GB",
        price: 9999,
        description: "6.71\" HD+ display, 50MP dual camera, 5000mAh battery, MediaTek Helio G85 processor. Dual SIM 4G.",
        category: "Smartphones",
        inStock: true,
        image: null,
        views: 210,
        createdAt: Date.now() - 86400000 * 9,
      },
      {
        id: "3",
        name: "Portronics Koral 10 Power Bank 10000mAh",
        price: 799,
        description: "Dual USB output, 22.5W fast charge support, LED indicator. Compact and lightweight. Charges 2 devices simultaneously.",
        category: "Power & Charging",
        inStock: true,
        image: null,
        views: 57,
        createdAt: Date.now() - 86400000 * 7,
      },
      {
        id: "4",
        name: "realme Watch 2 Pro",
        price: 3499,
        description: "1.75\" large display, GPS, SpO2 & heart rate monitor, 90 sports modes, 14-day battery life. Water resistant.",
        category: "Wearables",
        inStock: true,
        image: null,
        views: 130,
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: "5",
        name: "TP-Link Archer C64 AC1200 Router",
        price: 2199,
        description: "AC1200 dual-band WiFi, 4 antennas, MU-MIMO, beamforming. Covers up to 1200 sq.ft. Easy setup with Tether app.",
        category: "Networking",
        inStock: true,
        image: null,
        views: 48,
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: "6",
        name: "Ant Esports MK1000 Mechanical Keyboard",
        price: 1899,
        description: "TKL layout, RGB backlight, blue switches, plug & play USB. Aluminium top plate. Anti-ghosting 26-key rollover.",
        category: "Accessories",
        inStock: true,
        image: null,
        views: 77,
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "7",
        name: "Logitech M235 Wireless Mouse",
        price: 999,
        description: "2.4GHz wireless, 12-month battery life, contoured design, nano receiver. Works on most surfaces including glass.",
        category: "Accessories",
        inStock: true,
        image: null,
        views: 62,
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: "8",
        name: "Fire-Boltt Ninja Call Pro Plus Smartwatch",
        price: 1599,
        description: "Bluetooth calling, 1.83\" display, 100+ sports modes, AI voice assistant, 240+ watch faces. IP67 water resistant.",
        category: "Wearables",
        inStock: false,
        image: null,
        views: 95,
        createdAt: Date.now() - 86400000 * 1,
      },
    ],
  };
}

module.exports = { getProducts, getProduct, addProduct, updateProduct, deleteProduct, incrementViews };
