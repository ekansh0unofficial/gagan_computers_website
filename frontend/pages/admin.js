/**
 * pages/admin.js
 * Shopkeeper-only panel. Renders a login screen first;
 * only on valid password does the dashboard appear.
 */
const AdminPage = (() => {
  let products = [];
  let editingProduct = null;

  const CATEGORIES = [
    "Smartphones", "Audio", "Wearables", "Accessories",
    "Networking", "Power & Charging", "Laptops & Tablets", "Other",
  ];

  async function render() {
    const token = API.getToken();
    if (token) {
      try {
        const res = await API.verifyToken();
        if (res.valid) { renderDashboard(); return; }
      } catch (_) {}
      API.clearToken();
    }
    renderLogin();
  }

  // LOGIN
  function renderLogin() {
    document.getElementById("pageContainer").innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand">
            <div class="login-logo">🛍</div>
            <h1 class="login-title">Shopkeeper Login</h1>
            <p class="login-sub">Enter your password to access the admin panel</p>
          </div>
          <div class="login-form">
            <div class="lf-group">
              <label class="lf-label">Password</label>
              <div class="lf-input-wrap">
                <span class="lf-icon">🔒</span>
                <input type="password" id="adminPassword" class="lf-input" placeholder="Enter admin password"
                  onkeydown="if(event.key==='Enter') AdminPage.login()" autofocus />
                <button class="lf-toggle" onclick="AdminPage.togglePw(this)" type="button">👁</button>
              </div>
            </div>
            <div id="loginError" class="login-error" style="display:none"></div>
            <button class="login-btn" id="loginBtn" onclick="AdminPage.login()">
              <span id="loginBtnText">Sign In →</span>
            </button>
          </div>
          <button class="login-back" onclick="App.navigate('home')">← Back to Store</button>
        </div>
      </div>`;
  }

  function togglePw(btn) {
    const inp = document.getElementById("adminPassword");
    inp.type = inp.type === "password" ? "text" : "password";
    btn.textContent = inp.type === "text" ? "🙈" : "👁";
  }

  async function login() {
    const pw    = document.getElementById("adminPassword")?.value;
    const btn   = document.getElementById("loginBtn");
    const label = document.getElementById("loginBtnText");
    const err   = document.getElementById("loginError");
    if (!pw) { showLoginError("Please enter a password."); return; }
    btn.disabled = true; label.textContent = "Signing in…"; err.style.display = "none";
    try {
      const res = await API.login(pw);
      API.setToken(res.token);
      renderDashboard();
    } catch (e) {
      showLoginError(e.message || "Incorrect password.");
      btn.disabled = false; label.textContent = "Sign In →";
    }
  }

  function showLoginError(msg) {
    const el = document.getElementById("loginError");
    if (!el) return;
    el.textContent = "⚠ " + msg; el.style.display = "block";
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  }

  // DASHBOARD SHELL
  async function renderDashboard() {
    document.getElementById("pageContainer").innerHTML = `
      <div class="adm-layout">
        <aside class="adm-sidebar">
          <div class="adm-sidebar-brand">
            <span class="adm-brand-icon">🛍</span>
            <div>
              <div class="adm-brand-name" id="sidebarShopName">Dukaan</div>
              <div class="adm-brand-role">Admin Panel</div>
            </div>
          </div>
          <nav class="adm-nav">
            <button class="adm-nav-item active" id="navProducts" onclick="AdminPage.showSection('products')">
              <span class="adm-nav-icon">📦</span> Products
            </button>
            <button class="adm-nav-item" id="navAdd" onclick="AdminPage.showSection('add')">
              <span class="adm-nav-icon">➕</span> Add Product
            </button>
          </nav>
          <div class="adm-sidebar-footer">
            <button class="adm-back" onclick="App.navigate('home')"><span>🏠</span> View Store</button>
            <button class="adm-logout" onclick="AdminPage.logout()"><span>🚪</span> Logout</button>
          </div>
        </aside>
        <main class="adm-main">
          <div class="adm-topbar">
            <div id="adm-section-title" class="adm-topbar-title">Products</div>
            <div id="adm-topbar-actions" class="adm-topbar-actions"></div>
          </div>
          <div class="adm-content" id="adm-content">
            <div class="adm-spinner"><div class="spin-ring"></div></div>
          </div>
        </main>
      </div>`;
    try {
      const cfg = await API.getConfig();
      const el = document.getElementById("sidebarShopName");
      if (el && cfg.shopName) el.textContent = cfg.shopName;
    } catch (_) {}
    showSection("products");
  }

  function showSection(section) {
    document.querySelectorAll(".adm-nav-item").forEach(b => b.classList.remove("active"));
    const navEl = document.getElementById(section === "add" || section === "edit" ? "navAdd" : "navProducts");
    if (navEl) navEl.classList.add("active");
    const titles = { products: "All Products", add: "Add New Product", edit: "Edit Product" };
    const titleEl = document.getElementById("adm-section-title");
    if (titleEl) titleEl.textContent = titles[section] || "";
    if (section === "products") renderProductsList();
    else if (section === "add") { editingProduct = null; renderProductForm(); }
  }

  // PRODUCTS LIST
  async function renderProductsList() {
    const content = document.getElementById("adm-content");
    const actions = document.getElementById("adm-topbar-actions");
    if (!content) return;
    if (actions) actions.innerHTML = `<button class="adm-action-btn" onclick="AdminPage.showSection('add')">+ Add Product</button>`;
    content.innerHTML = `<div class="adm-spinner"><div class="spin-ring"></div></div>`;
    try {
      const res = await API.getProducts({ sort: "newest" });
      products = res.products;
    } catch (e) {
      content.innerHTML = `<div class="adm-empty"><p style="color:var(--error)">Failed: ${e.message}</p></div>`;
      return;
    }
    if (!products.length) {
      content.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">📦</div><h3>No products yet</h3><p>Add your first product to get started.</p><button class="adm-action-btn" style="margin-top:16px" onclick="AdminPage.showSection('add')">+ Add Product</button></div>`;
      return;
    }
    const inStock = products.filter(p => p.inStock).length;
    const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
    content.innerHTML = `
      <div class="adm-stats">
        <div class="adm-stat"><div class="adm-stat-val">${products.length}</div><div class="adm-stat-lbl">Products</div></div>
        <div class="adm-stat"><div class="adm-stat-val" style="color:var(--success)">${inStock}</div><div class="adm-stat-lbl">In Stock</div></div>
        <div class="adm-stat"><div class="adm-stat-val" style="color:var(--error)">${products.length - inStock}</div><div class="adm-stat-lbl">Out of Stock</div></div>
        <div class="adm-stat"><div class="adm-stat-val">${totalViews}</div><div class="adm-stat-lbl">Total Views</div></div>
      </div>
      <div class="adm-search-row">
        <input class="adm-search" type="text" placeholder="🔍  Filter products…" oninput="AdminPage.filterList(this.value)" />
      </div>
      <div class="adm-product-grid" id="adminProductGrid">
        ${products.map(renderProductCard).join("")}
      </div>`;
  }

  function filterList(q) {
    document.querySelectorAll(".adm-prod-card").forEach(card => {
      card.style.display = (!q || card.dataset.name.includes(q.toLowerCase())) ? "" : "none";
    });
  }

  function renderProductCard(p) {
    const thumb = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="adm-prod-img">`
      : `<div class="adm-prod-img adm-prod-img--placeholder">${Search.emojiForCategory(p.category)}</div>`;
    const stockBadge = p.inStock
      ? `<span class="adm-badge adm-badge--in">In Stock</span>`
      : `<span class="adm-badge adm-badge--out">Out of Stock</span>`;
    return `
      <div class="adm-prod-card" data-name="${p.name.toLowerCase()}">
        <div class="adm-prod-card-img">${thumb}</div>
        <div class="adm-prod-card-body">
          <div class="adm-prod-card-cat">${p.category}</div>
          <div class="adm-prod-card-name">${p.name}</div>
          <div class="adm-prod-card-meta">
            <span class="adm-prod-card-price">₹${p.price.toFixed(2)}</span>
            ${stockBadge}
          </div>
          <div class="adm-prod-card-views">👁 ${p.views || 0} views</div>
        </div>
        <div class="adm-prod-card-actions">
          <button class="adm-icon-btn adm-icon-btn--edit" onclick="AdminPage.editProduct('${p.id}')">✏️ Edit</button>
          <button class="adm-icon-btn adm-icon-btn--delete" onclick="AdminPage.confirmDelete('${p.id}', '${p.name.replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">🗑 Delete</button>
        </div>
      </div>`;
  }

  // PRODUCT FORM
  function renderProductForm() {
    const p = editingProduct || {};
    const isEdit = !!editingProduct;
    const titleEl = document.getElementById("adm-section-title");
    if (titleEl) titleEl.textContent = isEdit ? "Edit Product" : "Add New Product";
    const actions = document.getElementById("adm-topbar-actions");
    if (actions) actions.innerHTML = `<button class="adm-ghost-btn" onclick="AdminPage.showSection('products')">← Back</button>`;

    document.getElementById("adm-content").innerHTML = `
      <div class="adm-form-wrap">
        <form id="productForm" onsubmit="AdminPage.submitForm(event)">
          <div class="adm-form-card">
            <div class="adm-form-card-title">Product Image</div>
            <label class="adm-upload" id="uploadZone">
              <input type="file" id="imageFile" name="image" accept="image/*" onchange="AdminPage.previewImage(this)" />
              <div id="uploadInner">
                ${p.image
                  ? `<img src="${p.image}" class="adm-upload-preview" id="imgPreview" alt="Product">`
                  : `<div class="adm-upload-placeholder"><div class="adm-upload-icon">📷</div><div class="adm-upload-hint">Click or drag to upload</div><div class="adm-upload-sub">JPG, PNG, WebP · Max 5 MB</div></div>`}
              </div>
            </label>
          </div>

          <div class="adm-form-card">
            <div class="adm-form-card-title">Product Details</div>
            <div class="adm-field-row">
              <div class="adm-field">
                <label class="adm-label">Product Name <span class="req">*</span></label>
                <input class="adm-input" name="name" required placeholder="e.g. boAt Rockerz 450" value="${p.name || ""}">
              </div>
              <div class="adm-field">
                <label class="adm-label">Price (₹) <span class="req">*</span></label>
                <div class="adm-input-prefix-wrap">
                  <span class="adm-input-prefix">₹</span>
                  <input class="adm-input adm-input--prefixed" name="price" type="number" min="1" step="0.01" required placeholder="1299" value="${p.price || ""}">
                </div>
              </div>
            </div>
            <div class="adm-field">
              <label class="adm-label">Description</label>
              <textarea class="adm-input adm-textarea" name="description" placeholder="What makes this product great…">${p.description || ""}</textarea>
            </div>
            <div class="adm-field-row">
              <div class="adm-field">
                <label class="adm-label">Category</label>
                <select class="adm-input adm-select" name="category">
                  ${CATEGORIES.map(c => `<option value="${c}" ${p.category === c ? "selected" : ""}>${c}</option>`).join("")}
                </select>
              </div>
              <div class="adm-field">
                <label class="adm-label">Stock Status</label>
                <div class="adm-toggle-group">
                  <label class="adm-toggle-opt">
                    <input type="radio" name="inStock" value="true" ${p.inStock !== false ? "checked" : ""}><span>✅ In Stock</span>
                  </label>
                  <label class="adm-toggle-opt">
                    <input type="radio" name="inStock" value="false" ${p.inStock === false ? "checked" : ""}><span>❌ Out of Stock</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="adm-form-actions">
            <button type="button" class="adm-ghost-btn" onclick="AdminPage.showSection('products')">Cancel</button>
            <button type="submit" class="adm-submit-btn" id="submitBtn">
              ${isEdit ? "💾  Save Changes" : "➕  Add Product"}
            </button>
          </div>
        </form>
      </div>`;

    const zone = document.getElementById("uploadZone");
    zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", e => {
      e.preventDefault(); zone.classList.remove("drag-over");
      const f = e.dataTransfer.files[0];
      if (f) { document.getElementById("imageFile").files = e.dataTransfer.files; previewImage(document.getElementById("imageFile")); }
    });
  }

  function previewImage(input) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("uploadInner").innerHTML = `<img src="${e.target.result}" class="adm-upload-preview" id="imgPreview" alt="Preview">`;
    };
    reader.readAsDataURL(input.files[0]);
  }

  async function submitForm(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = "Saving…";
    const fd = new FormData(e.target);
    try {
      if (editingProduct) {
        await API.updateProduct(editingProduct.id, fd);
        Toast.show("Product updated ✅", "success");
      } else {
        await API.createProduct(fd);
        Toast.show("Product added ✅", "success");
      }
      editingProduct = null;
      showSection("products");
    } catch (err) {
      Toast.show("Error: " + err.message, "error");
      btn.disabled = false; btn.textContent = orig;
    }
  }

  async function editProduct(id) {
    try {
      const res = await API.getProduct(id);
      editingProduct = res.product;
    } catch (_) {
      editingProduct = products.find(p => p.id === id) || null;
    }
    document.querySelectorAll(".adm-nav-item").forEach(b => b.classList.remove("active"));
    document.getElementById("navAdd")?.classList.add("active");
    const titleEl = document.getElementById("adm-section-title");
    if (titleEl) titleEl.textContent = "Edit Product";
    renderProductForm();
  }

  function confirmDelete(id, name) {
    Modal.show(`
      <div style="text-align:center;padding:8px 0 4px;">
        <div style="font-size:3rem;margin-bottom:16px;">🗑️</div>
        <h3 style="font-size:1.2rem;margin-bottom:8px;">Delete Product?</h3>
        <p style="color:var(--text-2);font-size:0.9rem;margin-bottom:24px;">"<strong>${name}</strong>" will be permanently removed.</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-danger" onclick="AdminPage.deleteProduct('${id}')">Delete</button>
        </div>
      </div>`);
  }

  async function deleteProduct(id) {
    Modal.close();
    try {
      await API.deleteProduct(id);
      Toast.show("Product deleted", "success");
      renderProductsList();
    } catch (err) {
      Toast.show("Error: " + err.message, "error");
    }
  }

  async function logout() {
    try { await API.logout(); } catch (_) {}
    API.clearToken();
    Toast.show("Logged out successfully", "success");
    renderLogin();
  }

  return {
    render, login, logout, togglePw,
    showSection, filterList,
    submitForm, previewImage,
    editProduct, confirmDelete, deleteProduct,
  };
})();
