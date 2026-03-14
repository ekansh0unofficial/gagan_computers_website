/**
 * product-card.js — Renders a single product card HTML string
 */
const ProductCard = {
  render(product) {
    const isNew = Date.now() - product.createdAt < 7 * 86400000;
    const img = product.image
      ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
      : `<div class="product-card__placeholder">${Search.emojiForCategory(product.category)}</div>`;

    const badge = !product.inStock
      ? `<span class="badge-out">Out of stock</span>`
      : isNew
      ? `<span class="badge-new">New</span>`
      : "";

    return `
      <div class="product-card anim-fadeup" onclick="ProductCard.openDetail('${product.id}')">
        <div class="product-card__img">
          ${img}
          ${badge ? `<div class="product-card__badge">${badge}</div>` : ""}
        </div>
        <div class="product-card__body">
          <div class="product-card__cat">${product.category || "General"}</div>
          <div class="product-card__name">${product.name}</div>
          <div class="product-card__desc">${product.description}</div>
          <div class="product-card__footer">
            <span class="product-card__price">₹${product.price.toFixed(2)}</span>
            <button
              class="product-card__add"
              onclick="event.stopPropagation(); ${product.inStock ? `Cart.add(${JSON.stringify(JSON.stringify(product))})` : ""}"
              ${!product.inStock ? "disabled" : ""}
            >
              ${product.inStock ? "+ Add" : "Sold out"}
            </button>
          </div>
        </div>
      </div>`;
  },

  // Fix: inline onclick stringification is tricky, use a registry instead
  _registry: {},

  renderSafe(product) {
    ProductCard._registry[product.id] = product;
    const isNew = Date.now() - product.createdAt < 7 * 86400000;
    const img = product.image
      ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
      : `<div class="product-card__placeholder">${Search.emojiForCategory(product.category)}</div>`;

    const badge = !product.inStock
      ? `<span class="badge-out">Out of stock</span>`
      : isNew
      ? `<span class="badge-new">New</span>`
      : "";

    return `
      <div class="product-card anim-fadeup" data-pid="${product.id}" onclick="ProductCard.openDetail('${product.id}')">
        <div class="product-card__img">
          ${img}
          ${badge ? `<div class="product-card__badge">${badge}</div>` : ""}
        </div>
        <div class="product-card__body">
          <div class="product-card__cat">${product.category || "General"}</div>
          <div class="product-card__name">${product.name}</div>
          <div class="product-card__desc">${product.description}</div>
          <div class="product-card__footer">
            <span class="product-card__price">₹${product.price.toFixed(2)}</span>
            <button
              class="product-card__add"
              onclick="event.stopPropagation(); ProductCard.addToCart('${product.id}')"
              ${!product.inStock ? "disabled" : ""}
            >
              ${product.inStock ? "+ Add" : "Sold out"}
            </button>
          </div>
        </div>
      </div>`;
  },

  addToCart(id) {
    const p = ProductCard._registry[id];
    if (p) Cart.add(p);
  },

  openDetail(id) {
    const product = ProductCard._registry[id];
    if (!product) return;

    const img = product.image
      ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin-bottom:20px;">`
      : `<div style="text-align:center;font-size:5rem;margin-bottom:16px;">${Search.emojiForCategory(product.category)}</div>`;

    const badge = !product.inStock
      ? `<span class="badge-out" style="margin-bottom:10px;display:inline-block;">Out of stock</span>`
      : "";

    Modal.show(`
      ${img}
      ${badge}
      <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-3);margin-bottom:4px;">${product.category || "General"}</div>
      <h2 style="font-family:'Syne',sans-serif;font-size:1.5rem;margin-bottom:10px;">${product.name}</h2>
      <p style="color:var(--text-2);font-size:0.95rem;line-height:1.6;margin-bottom:20px;">${product.description}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <span style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--primary);">₹${product.price.toFixed(2)}</span>
        <button class="btn btn-primary btn-lg" ${!product.inStock ? "disabled" : ""} onclick="ProductCard.addToCart('${product.id}');Modal.close();">
          🛒 Add to Cart
        </button>
      </div>
    `);
  },
};
