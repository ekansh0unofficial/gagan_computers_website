/**
 * search.js — Smart search with live suggestions
 *
 * FIXES:
 *  1. emojiForCategory now covers all actual product categories
 *     (Smartphones, Audio, Wearables, Accessories, Networking, etc.)
 *  2. Search scoring uses word-boundary aware matching — "mobile" now
 *     matches "Redmi" (smartphone category bonus) correctly and doesn't
 *     surface unrelated items that happen to contain the letters in a
 *     longer word inside description text.
 *  3. Category synonym matching added — searching "mobile" or "phone"
 *     now boosts Smartphones category products.
 */
const Search = (() => {
  let allProducts = [];
  let debounceTimer = null;

  const input = () => document.getElementById("searchInput");
  const suggestions = () => document.getElementById("searchSuggestions");
  const clearBtn = () => document.getElementById("searchClear");

  // ── Category synonyms for smarter matching ────────────────
  // Maps search terms → category names they should boost
  const CATEGORY_SYNONYMS = {
    "mobile":      ["Smartphones"],
    "phone":       ["Smartphones"],
    "smartphone":  ["Smartphones"],
    "headphone":   ["Audio"],
    "earphone":    ["Audio"],
    "speaker":     ["Audio"],
    "music":       ["Audio"],
    "watch":       ["Wearables"],
    "smartwatch":  ["Wearables"],
    "fitness":     ["Wearables"],
    "keyboard":    ["Accessories"],
    "mouse":       ["Accessories"],
    "cable":       ["Accessories"],
    "charger":     ["Power & Charging"],
    "powerbank":   ["Power & Charging"],
    "power bank":  ["Power & Charging"],
    "battery":     ["Power & Charging"],
    "router":      ["Networking"],
    "wifi":        ["Networking"],
    "network":     ["Networking"],
    "laptop":      ["Laptops & Tablets"],
    "tablet":      ["Laptops & Tablets"],
  };

  function init(products) {
    allProducts = products;
    const inp = input();
    if (!inp) return;

    inp.addEventListener("input", (e) => {
      const val = e.target.value;
      clearBtn().classList.toggle("visible", val.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => showSuggestions(val), 180);
    });

    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        hideSuggestions();
        const q = inp.value.trim();
        if (q) App.navigate("home", { q });
      }
      if (e.key === "Escape") { hideSuggestions(); inp.blur(); }
    });

    // Hide on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrapper")) hideSuggestions();
    });
  }

  // ── Scoring logic ─────────────────────────────────────────
  function scoreProduct(product, q) {
    const nameLower = product.name.toLowerCase();
    const catLower  = (product.category || "").toLowerCase();
    const descLower = product.description.toLowerCase();
    let score = 0;

    // Exact name match → highest priority
    if (nameLower === q) return 100;

    // Name starts with query
    if (nameLower.startsWith(q)) score += 40;

    // Name contains query as a whole word (word boundary)
    const wordBoundary = new RegExp(`\\b${escapeRegex(q)}`, "i");
    if (wordBoundary.test(product.name)) score += 25;
    else if (nameLower.includes(q)) score += 12; // substring match, lower weight

    // Category exact match
    if (catLower === q) score += 30;
    else if (catLower.includes(q)) score += 15;

    // Category synonym boost — e.g. "mobile" → Smartphones
    const boostedCategories = CATEGORY_SYNONYMS[q] || [];
    if (boostedCategories.some(c => c.toLowerCase() === catLower)) score += 35;

    // Description word-boundary match (lower weight to avoid false positives)
    if (wordBoundary.test(product.description)) score += 6;
    else if (descLower.includes(q)) score += 2;

    return score;
  }

  function showSuggestions(query) {
    const q = query.toLowerCase().trim();
    const box = suggestions();

    if (!q || q.length < 1) { hideSuggestions(); return; }

    const scored = allProducts
      .map((p) => ({ ...p, _score: scoreProduct(p, q) }))
      .filter((p) => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    if (!scored.length) { hideSuggestions(); return; }

    box.innerHTML = scored
      .map((p) => {
        const hl = highlightMatch(p.name, q);
        return `
          <div class="suggestion-item" onclick="Search.selectSuggestion('${p.id}', '${escStr(p.name)}')">
            <span>${emojiForCategory(p.category)}</span>
            <span>${hl}</span>
            <span class="suggestion-cat">${p.category || ""}</span>
          </div>`;
      })
      .join("");

    box.classList.add("open");
  }

  function hideSuggestions() {
    suggestions()?.classList.remove("open");
  }

  function selectSuggestion(id, name) {
    hideSuggestions();
    input().value = name;
    clearBtn().classList.add("visible");
    App.navigate("home", { q: name });
  }

  function clear() {
    input().value = "";
    clearBtn().classList.remove("visible");
    hideSuggestions();
    App.navigate("home");
  }

  function setValue(val) {
    const inp = input();
    if (inp) {
      inp.value = val || "";
      clearBtn().classList.toggle("visible", !!(val));
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `<em>${text.slice(idx, idx + query.length)}</em>` +
      text.slice(idx + query.length)
    );
  }

  function escStr(s) {
    return s.replace(/'/g, "\\'");
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ── Category → Emoji map (covers all Dukaan categories) ──
  function emojiForCategory(cat) {
    const map = {
      // Electronics store categories
      "smartphones":        "📱",
      "audio":              "🎧",
      "wearables":          "⌚",
      "accessories":        "⌨️",
      "networking":         "📡",
      "power & charging":   "🔋",
      "laptops & tablets":  "💻",
      "cameras":            "📷",
      "gaming":             "🎮",
      "televisions":        "📺",
      "appliances":         "🏠",
      // Generic fallbacks
      "groceries":          "🌾",
      "personal care":      "🧴",
      "kitchen":            "🍳",
      "clothing":           "👕",
      "electronics":        "⚡",
      "food & beverages":   "🥗",
      "general":            "🛍️",
      "other":              "📦",
    };
    return map[(cat || "").toLowerCase()] || "📦";
  }

  return { init, clear, selectSuggestion, setValue, emojiForCategory };
})();