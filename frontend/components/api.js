/**
 * api.js — Centralised API layer
 * Automatically attaches the admin token to write requests.
 */
const API = (() => {
  const BASE = "/api";
  const TOKEN_KEY = "dukaan_admin_token";

  // ── Token helpers ─────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ── Core fetch ────────────────────────────────────────────
  async function request(method, path, body, isFormData = false) {
    const opts = { method, headers: {} };

    const token = getToken();
    if (token) opts.headers["x-admin-token"] = token;

    if (body) {
      if (isFormData) {
        opts.body = body;
      } else {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  return {
    // Auth
    login:       (password) => request("POST", "/auth/login", { password }),
    logout:      ()         => request("POST", "/auth/logout"),
    verifyToken: ()         => request("GET",  "/auth/verify"),
    getToken, setToken, clearToken,

    // Config
    getConfig: () => request("GET", "/config"),

    // Products
    getProducts: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request("GET", `/products${qs ? "?" + qs : ""}`);
    },
    getFeatured:   ()         => request("GET",    "/products/featured"),
    getProduct:    (id)       => request("GET",    `/products/${id}`),
    getCategories: ()         => request("GET",    "/products/categories"),
    createProduct: (fd)       => request("POST",   "/products", fd, true),
    updateProduct: (id, fd)   => request("PUT",    `/products/${id}`, fd, true),
    deleteProduct: (id)       => request("DELETE", `/products/${id}`),

    // Orders
    createWhatsAppOrder: (payload) => request("POST", "/orders/whatsapp", payload),
  };
})();
