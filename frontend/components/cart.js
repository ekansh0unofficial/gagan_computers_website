/**
 * cart.js — Cart state management & drawer UI
 * Cart is persisted to localStorage so it survives page refresh.
 */
const Cart = (() => {
  const STORAGE_KEY = "dukaan_cart";
  let items = [];

  // ── Persistence ─────────────────────────────────────────
  function load() {
    try { items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { items = []; }
    updateBadge();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateBadge();
  }

  // ── Public ───────────────────────────────────────────────
  function add(product) {
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ ...product, quantity: 1 });
    }
    save();
    Toast.show(`${product.name} added to cart 🛒`, "success");
    updateBadge();
    // Animate badge
    const badge = document.getElementById("cartBadge");
    if (badge) { badge.style.transform = "scale(1.5)"; setTimeout(() => badge.style.transform = "", 200); }
  }

  function remove(id) {
    items = items.filter((i) => i.id !== id);
    save();
    renderDrawer();
  }

  function setQty(id, qty) {
    if (qty <= 0) { remove(id); return; }
    const item = items.find((i) => i.id === id);
    if (item) item.quantity = qty;
    save();
    renderDrawer();
  }

  function getItems() { return [...items]; }
  function getTotal() { return items.reduce((s, i) => s + i.price * i.quantity, 0); }
  function getCount() { return items.reduce((s, i) => s + i.quantity, 0); }
  function isEmpty() { return items.length === 0; }
  function clear() { items = []; save(); renderDrawer(); }

  // ── Drawer UI ────────────────────────────────────────────
  function open() {
    renderDrawer();
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("overlay").classList.add("show");
  }

  function close() {
    document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
  }

  function updateBadge() {
    const count = getCount();
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    badge.style.display = count > 0 ? "flex" : "none";
    badge.textContent = count > 9 ? "9+" : count;
  }

  function renderDrawer() {
    const container = document.getElementById("cartItems");
    const footer = document.getElementById("cartFooter");
    if (!container) return;

    if (isEmpty()) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="icon">🛒</div>
          <p><strong>Your cart is empty</strong></p>
          <p style="font-size:0.85rem">Browse our products and add something!</p>
        </div>`;
      footer.innerHTML = "";
      return;
    }

    container.innerHTML = items.map((item) => `
      <div class="cart-item">
        <div class="cart-item__img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`
            : Search.emojiForCategory(item.category)
          }
        </div>
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="cart-item__controls">
          <button class="qty-btn" onclick="Cart.setQty('${item.id}', ${item.quantity - 1})">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="Cart.setQty('${item.id}', ${item.quantity + 1})">+</button>
        </div>
      </div>`).join("");

    footer.innerHTML = `
      <div class="cart-total">
        <span class="cart-total-label">Total (${getCount()} items)</span>
        <span class="cart-total-amount">₹${getTotal().toFixed(2)}</span>
      </div>
      <button class="btn btn-success btn-full btn-lg" onclick="Cart.checkout()">
        Checkout via WhatsApp 📲
      </button>
      <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="Cart.close()">
        Continue Shopping
      </button>`;
  }

  function checkout() {
    close();
    App.navigate("checkout");
  }

  // Init
  load();

  return { add, remove, setQty, getItems, getTotal, getCount, isEmpty, clear, open, close, checkout, load };
})();
