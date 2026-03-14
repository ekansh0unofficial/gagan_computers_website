/**
 * pages/checkout.js — Order summary, customer details,
 *                     WhatsApp checkout, UPI payment panel.
 */
const CheckoutPage = (() => {
  let config = {};
  let orderResult = null;

  async function render() {
    if (Cart.isEmpty()) {
      App.navigate("home");
      Toast.show("Your cart is empty!", "error");
      return;
    }

    // Load shop config for UPI details
    try { config = await API.getConfig(); } catch (_) {}

    document.getElementById("pageContainer").innerHTML = `
      <div class="container">
        <div class="page-content">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
            <button class="btn btn-ghost" onclick="App.navigate('home')" style="padding:8px 12px;">← Shop</button>
            <h1 style="font-size:1.4rem;">Checkout</h1>
          </div>
          <div class="checkout-layout">
            <div>
              ${renderOrderSummary()}
              ${renderCustomerForm()}
            </div>
            <div>
              ${renderPaymentPanel()}
            </div>
          </div>
        </div>
      </div>
      <footer class="site-footer">
        <strong>${config.shopName || "Dukaan"}</strong> · Orders via WhatsApp
      </footer>
    `;

    // Render QR code now that the DOM is ready
    renderQRCode();
  }

  function renderOrderSummary() {
    const items = Cart.getItems();
    const rows = items.map((item) => `
      <div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light);">
        <div style="width:52px;height:52px;border-radius:6px;background:var(--surface-2);flex-shrink:0;
                    display:flex;align-items:center;justify-content:center;font-size:1.5rem;overflow:hidden;">
          ${item.image
            ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;">`
            : Search.emojiForCategory(item.category)}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.9rem;">${item.name}</div>
          <div style="font-size:0.82rem;color:var(--text-3);">Qty: ${item.quantity}</div>
        </div>
        <div style="font-weight:700;color:var(--primary);white-space:nowrap;">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>`).join("");

    return `
      <div class="checkout-card" style="margin-bottom:20px;">
        <h2 style="font-size:1.1rem;margin-bottom:4px;">🛒 Order Summary</h2>
        <div style="font-size:0.82rem;color:var(--text-3);margin-bottom:16px;">${Cart.getCount()} item${Cart.getCount() !== 1 ? "s" : ""}</div>
        ${rows}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;">
          <span style="font-size:0.9rem;font-weight:600;color:var(--text-2);">Total Amount</span>
          <span style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--primary);">
            ₹${Cart.getTotal().toFixed(2)}
          </span>
        </div>
      </div>`;
  }

  function renderCustomerForm() {
    return `
      <div class="checkout-card">
        <h2 style="font-size:1.1rem;margin-bottom:16px;">👤 Your Details <span style="font-weight:400;font-size:0.8rem;color:var(--text-3)">(optional but helpful)</span></h2>
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input class="form-input" id="customerName" placeholder="e.g. Rahul Sharma">
        </div>
        <div class="form-group">
          <label class="form-label">Note for Shopkeeper</label>
          <textarea class="form-input" id="customerNote" rows="2" placeholder="Delivery address, preferred time, colour preference…"></textarea>
        </div>
        <button class="btn btn-success btn-full btn-lg" onclick="CheckoutPage.placeOrder()" id="waBtn">
          <span>📲</span> Send Order on WhatsApp
        </button>
        <p style="font-size:0.78rem;color:var(--text-3);text-align:center;margin-top:10px;">
          Your cart details will open in WhatsApp. The shopkeeper will confirm your order.
        </p>
      </div>`;
  }

  function renderPaymentPanel() {
    const upiId = config.upiId || "yourshop@upi";
    const upiName = config.upiName || "Shop Owner";
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR`;

    return `
      <div class="payment-panel">
        <h3>💳 Payment Details</h3>
        <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:4px;">Pay via UPI after placing your order</p>

        <div class="upi-chip">${upiId}</div>
        <div style="font-size:0.82rem;color:var(--text-2);margin-bottom:4px;">UPI Name: <strong>${upiName}</strong></div>

        <div id="qrBox" style="
          width:180px;height:180px;
          margin:16px auto;
          border-radius:var(--radius);
          background:#fff;
          display:flex;align-items:center;justify-content:center;
          padding:10px;
          border:1px solid var(--border);
        ">
          <div style="font-size:0.75rem;color:var(--text-3);text-align:center;">Loading QR…</div>
        </div>

        <a href="${upiLink}" class="btn btn-primary btn-full" style="margin-top:4px;text-decoration:none;">
          Open in UPI App
        </a>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-light);font-size:0.82rem;color:var(--text-3);text-align:left;">
          <div style="font-weight:600;color:var(--text-2);margin-bottom:8px;">How it works:</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div>1️⃣ Click "Send Order on WhatsApp"</div>
            <div>2️⃣ Shopkeeper confirms your order</div>
            <div>3️⃣ Pay via UPI ID above</div>
            <div>4️⃣ Share payment screenshot on WhatsApp</div>
          </div>
        </div>
      </div>

      <div id="orderConfirmation" style="display:none;"></div>
    `;
  }

  // ── QR Code renderer ──────────────────────────────────────
  function renderQRCode() {
    const upiId   = config.upiId   || "yourshop@upi";
    const upiName = config.upiName || "Shop Owner";
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR`;
    const box     = document.getElementById("qrBox");
    if (!box) return;

    // If QRCode library is already loaded, use it directly
    if (typeof QRCode !== "undefined") {
      box.innerHTML = "";
      new QRCode(box, {
        text:         upiLink,
        width:        160,
        height:       160,
        colorDark:    "#000000",
        colorLight:   "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
      return;
    }

    // Otherwise load the library then render
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      box.innerHTML = "";
      new QRCode(box, {
        text:         upiLink,
        width:        160,
        height:       160,
        colorDark:    "#000000",
        colorLight:   "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    };
    script.onerror = () => {
      // Fallback: use Google Charts QR API
      box.innerHTML = `<img
        src="https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8"
        alt="UPI QR Code"
        style="width:160px;height:160px;display:block;"
      />`;
    };
    document.head.appendChild(script);
  }

  // ── Place Order ───────────────────────────────────────────
  async function placeOrder() {
    const btn = document.getElementById("waBtn");
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Preparing order…";

    const customerName = document.getElementById("customerName")?.value?.trim();
    const customerNote = document.getElementById("customerNote")?.value?.trim();

    try {
      const res = await API.createWhatsAppOrder({
        items: Cart.getItems(),
        customerName,
        customerNote,
      });

      orderResult = res;
      showOrderSuccess(res);

    } catch (err) {
      Toast.show("Error: " + err.message, "error");
      btn.disabled = false;
      btn.innerHTML = "<span>📲</span> Send Order on WhatsApp";
    }
  }

  function showOrderSuccess(res) {
    // Open WhatsApp
    window.open(res.whatsappUrl, "_blank");

    // Show confirmation banner
    const conf = document.getElementById("orderConfirmation");
    if (conf) {
      conf.style.display = "block";
      conf.innerHTML = `
        <div style="
          margin-top:20px;
          background:linear-gradient(135deg,#e8f5e9,#f1f8e9);
          border:2px solid var(--success);
          border-radius:var(--radius-lg);
          padding:24px;
          text-align:center;
          animation: pop 0.4s var(--ease);
        ">
          <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
          <h3 style="color:var(--success);margin-bottom:6px;">Order Sent!</h3>
          <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:4px;">
            Reference: <strong>${res.orderRef}</strong>
          </p>
          <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:16px;">
            WhatsApp should have opened. If not, <a href="${res.whatsappUrl}" target="_blank">click here</a>.
          </p>
          <button class="btn btn-primary" onclick="CheckoutPage.done()">Done — Continue Shopping</button>
        </div>`;
    }

    // Clear cart
    Cart.clear();
  }

  function done() {
    App.navigate("home");
  }

  return { render, placeOrder, done };
})();