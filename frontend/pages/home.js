/**
 * pages/home.js — Storefront: hero, filters, product grid, recommender
 */
const HomePage = (() => {
  let allProducts = [];
  let categories = [];
  let activeCategory = "all";
  let activeSort = "newest";
  let searchQuery = "";

  // ── Entry ─────────────────────────────────────────────────
  async function render(params = {}) {
    searchQuery = params.q || "";

    document.getElementById("pageContainer").innerHTML = `
      ${renderHero()}
      <div class="container">
        <div class="page-content">
          <div id="homeContent">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;

    Search.setValue(searchQuery);

    try {
      await loadProducts();
    } catch (e) {
      document.getElementById("homeContent").innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h3>Could not load products</h3>
          <p>${e.message}</p>
        </div>`;
    }
  }

  // ── Data ──────────────────────────────────────────────────
  async function loadProducts() {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (activeCategory !== "all") params.category = activeCategory;
    if (activeSort) params.sort = activeSort;

    const [prodRes, catRes] = await Promise.all([
      API.getProducts(params),
      API.getCategories(),
    ]);

    allProducts = prodRes.products;
    categories = catRes.categories;
    Search.init(prodRes.products); // update suggestion pool

    renderContent();
  }

  // ── Render ────────────────────────────────────────────────
  function renderHero() {
    return `
      <section class="hero">
        <div class="hero-inner">
          <h1 id="heroTitle">⚡ Gadgets & Electronics</h1>
          <p id="heroTagline">Top brands. Best prices. Delivered to your door.</p>
          <div class="hero-search">
            <div class="search-box" style="border-radius:8px;padding:4px 16px;">
              <span class="search-icon">⌕</span>
              <input
                type="text"
                class="search-input"
                placeholder="Search phones, headphones, chargers…"
                id="heroSearchInput"
                value=""
                autocomplete="off"
              />
            </div>
          </div>
          <div class="hero-chips" style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="hero-chip" onclick="HomePage.quickSearch('smartphones')">📱 Phones</button>
            <button class="hero-chip" onclick="HomePage.quickSearch('audio')">🎧 Audio</button>
            <button class="hero-chip" onclick="HomePage.quickSearch('wearables')">⌚ Wearables</button>
            <button class="hero-chip" onclick="HomePage.quickSearch('accessories')">⌨️ Accessories</button>
            <button class="hero-chip" onclick="HomePage.quickSearch('networking')">📡 Networking</button>
          </div>
        </div>
      </section>`;
  }

  function renderContent() {
    const content = document.getElementById("homeContent");
    if (!content) return;

    // ── Recommender strip (shown when not searching) ───────
    const trendingHtml = (!searchQuery) ? renderTrending() : "";

    // ── Category chips ─────────────────────────────────────
    const catChips = [
      `<button class="chip ${activeCategory === "all" ? "active" : ""}" onclick="HomePage.setCategory('all')">All</button>`,
      ...categories.map((c) => `
        <button class="chip ${activeCategory === c ? "active" : ""}" onclick="HomePage.setCategory('${c}')">
          ${Search.emojiForCategory(c)} ${c}
        </button>`),
    ].join("");

    // ── Sort dropdown ──────────────────────────────────────
    const sortOptions = [
      { v: "newest", l: "Newest First" },
      { v: "price_asc", l: "Price: Low to High" },
      { v: "price_desc", l: "Price: High to Low" },
    ];

    // ── Product grid ───────────────────────────────────────
    const gridHtml = allProducts.length
      ? allProducts.map((p) => ProductCard.renderSafe(p)).join("")
      : `<div class="empty-state" style="grid-column:1/-1">
           <div class="icon">🔍</div>
           <h3>No products found</h3>
           <p>${searchQuery ? `No results for "<strong>${searchQuery}</strong>"` : "No products in this category yet."}</p>
           <button class="btn btn-primary" style="margin-top:16px" onclick="HomePage.clearSearch()">Clear search</button>
         </div>`;

    content.innerHTML = `
      ${trendingHtml}

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div class="section-title" style="margin-bottom:0;font-size:1.15rem;">
          ${searchQuery
            ? `Results for "<em style="color:var(--primary);font-style:normal;">${searchQuery}</em>"`
            : "All Products"}
          <span style="font-size:0.8rem;font-weight:400;color:var(--text-3);font-family:Inter,sans-serif;">${allProducts.length} item${allProducts.length !== 1 ? "s" : ""}</span>
        </div>
        <select class="sort-select" onchange="HomePage.setSort(this.value)">
          ${sortOptions.map(o => `<option value="${o.v}" ${activeSort === o.v ? "selected" : ""}>${o.l}</option>`).join("")}
        </select>
      </div>

      <div class="chip-row">${catChips}</div>
      <div class="product-grid">${gridHtml}</div>
    `;

    // Bind hero search
    const heroInp = document.getElementById("heroSearchInput");
    if (heroInp) {

    // Stagger card animations
    document.querySelectorAll(".product-card.anim-fadeup").forEach((card, i) => {
      card.style.animationDelay = `${i * 55}ms`;
    });
      heroInp.value = searchQuery;
      heroInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = heroInp.value.trim();
          searchQuery = q;
          activeCategory = "all";
          Search.setValue(q);
          loadProducts();
        }
      });
    }
  }

  function renderTrending() {
    const trending = [...allProducts]
      .filter(p => p.inStock)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);

    if (!trending.length) return "";

    const cards = trending.map((p) => `
      <div class="rec-card" onclick="ProductCard.openDetail('${p.id}')">
        <div class="rec-card__img">
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}">`
            : `<div style="font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:100%;background:var(--surface-2);">${Search.emojiForCategory(p.category)}</div>`
          }
        </div>
        <div class="rec-card__body">
          <div class="rec-card__name">${p.name}</div>
          <div class="rec-card__price">₹${p.price.toFixed(2)}</div>
          <div class="rec-card__views">🔥 ${p.views} views</div>
        </div>
      </div>`).join("");

    return `
      <div class="rec-strip">
        <div class="section-title">🔥 Trending Now</div>
        <div class="rec-grid">${cards}</div>
      </div>`;
  }

  function renderFooter() {
    const shopName = document.getElementById("shopName")?.textContent || "Dukaan";
    return `
      <footer class="site-footer">
        <strong>${shopName}</strong> &nbsp;·&nbsp; Electronics &amp; Gadgets &nbsp;·&nbsp;
        Orders via WhatsApp &nbsp;·&nbsp; © ${new Date().getFullYear()}
      </footer>`;
  }

  // ── Actions ────────────────────────────────────────────────
  function setCategory(cat) {
    activeCategory = cat;
    loadProducts();
  }

  function setSort(sort) {
    activeSort = sort;
    loadProducts();
  }

  function clearSearch() {
    searchQuery = "";
    activeCategory = "all";
    Search.setValue("");
    loadProducts();
  }

  function quickSearch(term) {
    searchQuery = term;
    activeCategory = "all";
    Search.setValue(term);
    loadProducts();
  }

  return { render, setCategory, setSort, clearSearch, quickSearch };
})();