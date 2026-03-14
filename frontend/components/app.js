/**
 * components/app.js — Client-side router, Toast, Modal, App init
 *
 * FIXES:
 *  1. Removed duplicate `navigate` declaration (caused inconsistent routing state)
 *  2. Switched from hash-based (#admin) to pathname-based (/admin) routing
 *     so typing localhost:3000/admin in the URL bar works without the # prefix.
 *  3. `resolveHash` renamed to `resolvePath` and now reads pathname only —
 *     no more hash vs pathname ambiguity.
 */

// ── Toast utility ─────────────────────────────────────────
const Toast = (() => {
  let timer;
  function show(msg, type = "") {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    clearTimeout(timer);
    timer = setTimeout(() => { el.classList.remove("show"); }, 2800);
  }
  return { show };
})();

// ── Modal utility ─────────────────────────────────────────
const Modal = (() => {
  function show(html) {
    const overlay = document.getElementById("modalOverlay");
    const modal   = document.getElementById("modal");
    if (!overlay || !modal) return;
    modal.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
        <button class="close-btn" onclick="Modal.close()">✕</button>
      </div>
      ${html}`;
    overlay.classList.add("show");
    overlay.onclick = (e) => { if (e.target === overlay) Modal.close(); };
  }

  function close() {
    document.getElementById("modalOverlay")?.classList.remove("show");
  }

  return { show, close };
})();

// ── Router ────────────────────────────────────────────────
const App = (() => {
  const routes = {
    home:     (params) => HomePage.render(params),
    admin:    ()       => AdminPage.render(),
    checkout: ()       => CheckoutPage.render(),
  };

  // FIX: Single navigate function using real pathnames (no hash).
  // The server already serves index.html for /admin and /checkout,
  // so direct URL access works too.
  function navigate(route, params = {}) {
    const qs = params.q ? "?q=" + encodeURIComponent(params.q) : "";
    const path = "/" + (route === "home" ? "" : route) + qs;
    history.pushState({ route, params }, "", path);

    Cart.close();
    Modal.close();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const handler = routes[route] || routes.home;
    handler(params);
  }

  // FIX: Read pathname only — no more hash/pathname ambiguity.
  function resolvePath() {
    let route = "home";
    let params = {};

    // Strip leading slash, e.g. "/admin" → "admin"
    const raw = window.location.pathname.replace(/^\//, "").trim() || "home";
    const [routePart, qs] = raw.split("?");
    route = routePart || "home";

    // Also check query string from the actual URL (for ?q= searches)
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((v, k) => { params[k] = v; });

    // Fallback: parse qs fragment if present
    if (qs) {
      qs.split("&").forEach(pair => {
        const [k, v] = pair.split("=");
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    }

    const handler = routes[route] || routes.home;
    handler(params);
  }

  // ── Boot ──────────────────────────────────────────────────
  async function init() {
    // Load config and update nav
    try {
      const cfg = await API.getConfig();
      const nameEl = document.getElementById("shopName");
      if (nameEl && cfg.shopName) nameEl.textContent = cfg.shopName;
      document.title = `${cfg.shopName || "Dukaan"} — Electronics & Gadgets`;
    } catch (_) {}

    // Pre-load products for search suggestions
    try {
      const res = await API.getProducts({ sort: "newest" });
      Search.init(res.products);
    } catch (_) {}

    // Handle browser back/forward
    window.addEventListener("popstate", resolvePath);

    // Route on load
    resolvePath();
  }

  return { navigate, init };
})();

// ── Add trending recommender styles ──────────────────────
const recStyles = document.createElement("style");
recStyles.textContent = `
  .rec-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 8px;
  }

  .rec-card {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    border: 1.5px solid var(--border-light);
    box-shadow: var(--shadow);
    transition: transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
  }

  .rec-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  .rec-card__img {
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--surface-2);
  }

  .rec-card__img img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .rec-card:hover .rec-card__img img { transform: scale(1.06); }

  .rec-card__body {
    padding: 10px 12px;
  }

  .rec-card__name {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .rec-card__price {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--primary);
  }

  .rec-card__views {
    font-size: 0.72rem;
    color: var(--text-3);
    margin-top: 2px;
  }

  .hero-chip {
    padding: 6px 16px;
    border-radius: 99px;
    background: rgba(255,255,255,0.18);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1.5px solid rgba(255,255,255,0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }
  .hero-chip:hover {
    background: rgba(255,255,255,0.28);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    .rec-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
document.head.appendChild(recStyles);

// ── Kick off ─────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => App.init());