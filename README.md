# 🛍 Dukaan — Electronics & Gadgets Store

A lightweight, WhatsApp-first e-commerce platform for small businesses.
No payment gateway integration needed — orders go straight to WhatsApp,
payments via UPI.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔍 Smart Search | Live suggestions, relevance scoring, debounced |
| 🛒 Cart | Persists in browser localStorage |
| 📲 WhatsApp Checkout | Auto-generates pre-filled order message |
| 💳 UPI Payment | Shows UPI ID + deep link for any UPI app |
| 🔥 Recommender | Trending strip based on product view counts |
| 📷 Image Upload | Shopkeeper can upload product images (max 5MB) |
| ⚙ Admin Panel | Add / Edit / Delete products, no external CMS |
| 🗄 Zero-dep DB | JSON file store — no Postgres/Mongo needed |

---

## 🗂 Project Structure

```
dukaan/
├── backend/
│   ├── server.js           ← Express entry point
│   ├── routes/
│   │   ├── products.js     ← CRUD + search + view tracking
│   │   ├── orders.js       ← WhatsApp message generator
│   │   └── config.js       ← Public shop config endpoint
│   └── data/
│       └── db.js           ← JSON store (swap for Postgres here)
├── frontend/
│   ├── index.html          ← App shell
│   ├── styles/
│   │   ├── variables.css   ← Theme tokens (change colours here)
│   │   ├── base.css        ← Reset + typography
│   │   ├── components.css  ← All UI components
│   │   └── layout.css      ← Nav, grid, hero, footer
│   ├── components/
│   │   ├── api.js          ← All API calls (one place)
│   │   ├── app.js          ← Router + Toast + Modal + boot
│   │   ├── cart.js         ← Cart state + drawer UI
│   │   ├── product-card.js ← Card renderer + detail modal
│   │   └── search.js       ← Live suggestions + scoring
│   └── pages/
│       ├── home.js         ← Storefront + recommender
│       ├── admin.js        ← Shopkeeper panel
│       └── checkout.js     ← Order + payment
├── render.yaml             ← One-click Render deploy
└── .env.example            ← Copy to .env
```

---

## 🚀 Local Setup

```bash
# 1. Clone / download project
cd dukaan

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your WhatsApp number and UPI details

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

---

## ☁ Deploy to Render.com

1. Push this folder to a **GitHub repository**
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Apply**
5. In the Render dashboard → **Environment** tab, set:
   - `WHATSAPP_NUMBER` → e.g. `919876543210` (country code + number, no +)
   - `UPI_ID` → e.g. `yourshop@upi`
   - `UPI_NAME` → e.g. `Rahul Sharma`
   - `SHOP_NAME` → Your shop name
6. Click **Deploy** — your site will be live in ~2 minutes ✅

> **Note on uploads**: Render's free tier has an ephemeral filesystem — uploaded
> images will be lost on redeploy. For production, store images on
> [Cloudinary](https://cloudinary.com) (free tier). See `backend/routes/products.js`
> — replace `multer` storage with a Cloudinary upload stream.

---

## ⚙ Configuration

All customisation is in `.env` (or Render env vars):

```
SHOP_NAME=Dukaan
SHOP_TAGLINE=Electronics & Gadgets — Best Prices
WHATSAPP_NUMBER=919876543210
UPI_ID=yourshop@upi
UPI_NAME=Rahul Sharma
```

To retheme the site, edit `frontend/styles/variables.css` — every colour,
radius, and shadow is a CSS variable.

---

## 🔒 Securing the Admin Panel

The `/admin` page is currently open to anyone who knows the URL.
To restrict it, add a simple password check in `backend/server.js`:

```js
// Add before static file serving:
app.use('/api/products', (req, res, next) => {
  if (['POST','PUT','DELETE'].includes(req.method)) {
    const key = req.headers['x-admin-key'];
    if (key !== process.env.ADMIN_KEY) return res.status(401).json({ message: 'Unauthorised' });
  }
  next();
});
```

---

## 🛠 Upgrading the Database

To move from the JSON file to Postgres (e.g. on Render's managed Postgres):

1. Replace functions in `backend/data/db.js` with `pg` queries
2. The interface (`getProducts`, `addProduct`, etc.) stays identical
3. No changes needed in routes or frontend
