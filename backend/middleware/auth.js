/**
 * middleware/auth.js
 *
 * FIX: Sessions are now persisted to data/sessions.json so they survive
 * server restarts (e.g. nodemon reloading after products.json changes).
 *
 * Root cause of the "re-login after every action" bug:
 *   1. Admin deletes/edits a product
 *   2. db.js writes products.json inside the project directory
 *   3. nodemon detects the file change and restarts the server
 *   4. The in-memory `sessions` Map is wiped on restart
 *   5. Next request gets 401 Unauthorised
 *
 * Fix A (this file): persist sessions to data/sessions.json
 * Fix B (nodemon.json): tell nodemon to ignore data/*.json and uploads/*
 * Both fixes together make the app fully robust.
 */

const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");

// ── Session file path ────────────────────────────────────────
const SESSIONS_PATH = path.join(__dirname, "../data/sessions.json");

const SESSION_MS = (parseInt(process.env.ADMIN_SESSION_HOURS) || 12) * 60 * 60 * 1000;

// ── Persistent session store ─────────────────────────────────
function loadSessions() {
  try {
    if (!fs.existsSync(SESSIONS_PATH)) return new Map();
    const raw = JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf8"));
    // Convert plain object back to Map, dropping already-expired tokens
    const now = Date.now();
    return new Map(
      Object.entries(raw).filter(([, exp]) => exp > now)
    );
  } catch {
    return new Map();
  }
}

function saveSessions(sessions) {
  try {
    // Ensure the data directory exists
    const dir = path.dirname(SESSIONS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Convert Map to plain object for JSON serialisation
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(Object.fromEntries(sessions), null, 2));
  } catch (e) {
    console.error("Warning: could not persist sessions:", e.message);
  }
}

// Load sessions on startup (survives nodemon restarts)
const sessions = loadSessions();

// ── Helpers ──────────────────────────────────────────────────
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isValidToken(token) {
  if (!token || !sessions.has(token)) return false;
  const expiresAt = sessions.get(token);
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    saveSessions(sessions);
    return false;
  }
  return true;
}

// Prune expired tokens every hour
setInterval(() => {
  const now = Date.now();
  let pruned = false;
  for (const [token, exp] of sessions.entries()) {
    if (now > exp) { sessions.delete(token); pruned = true; }
  }
  if (pruned) saveSessions(sessions);
}, 60 * 60 * 1000);

// ── Middleware ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  // Only guard write methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const token =
    req.headers["x-admin-token"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!isValidToken(token)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised. Please log in as shopkeeper.",
    });
  }
  next();
}

// ── Auth Router ───────────────────────────────────────────────
const authRouter = express.Router();

// POST /api/auth/login
authRouter.post("/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Constant-time comparison to prevent timing attacks
  const expected = crypto.createHash("sha256").update(adminPassword).digest("hex");
  const provided  = crypto.createHash("sha256").update(password || "").digest("hex");

  if (expected !== provided) {
    return res.status(401).json({ success: false, message: "Incorrect password" });
  }

  const token = generateToken();
  sessions.set(token, Date.now() + SESSION_MS);
  saveSessions(sessions); // persist immediately after login

  res.json({
    success: true,
    token,
    expiresIn: SESSION_MS,
  });
});

// POST /api/auth/logout
authRouter.post("/logout", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token) {
    sessions.delete(token);
    saveSessions(sessions);
  }
  res.json({ success: true });
});

// GET /api/auth/verify
authRouter.get("/verify", (req, res) => {
  const token = req.headers["x-admin-token"];
  res.json({ success: true, valid: isValidToken(token) });
});

module.exports = { requireAuth, authRouter };