(() => {
  "use strict";

  /* Utilities */
  const q = (sel, ctx = document) => ctx.querySelector(sel);
  const qa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const safeNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
  const currency = (n) => `R${Number(n).toFixed(2)}`;

  /* Persistent */
  let cart = JSON.parse(localStorage.getItem("nina_cart_v1") || "[]");

  function saveCart() {
    localStorage.setItem("nina_cart_v1", JSON.stringify(cart));
    updateCartCount();
  }

  function loadCart() {
    cart = JSON.parse(localStorage.getItem("nina_cart_v1") || "[]");
    updateCartCount();
  }

  /* Cart helpers*/
  function findCartItemIndex(name, meta = "") {
    return cart.findIndex((i) => i.name === name && (i.meta || "") === (meta || ""));
  }

  function addItemToCart({ name, price, qty = 1, meta = "" }) {
    const idx = findCartItemIndex(name, meta);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ name, price: Number(price), qty: Number(qty), meta });
    }
    saveCart();
    animateAdd();
    renderAllCarts();
  }

  function updateItemQty(name, meta = "", change = 0) {
    const idx = findCartItemIndex(name, meta);
    if (idx < 0) return;
    cart[idx].qty = Math.max(0, cart[idx].qty + change);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
    saveCart();
    renderAllCarts();
  }

  function setItemQty(name, meta = "", qty = 1) {
    const idx = findCartItemIndex(name, meta);
    if (idx < 0) return;
    cart[idx].qty = Math.max(0, qty);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
    saveCart();
    renderAllCarts();
  }

  function removeItem(name, meta = "") {
    const idx = findCartItemIndex(name, meta);
    if (idx < 0) return;
    cart.splice(idx, 1);
    saveCart();
    renderAllCarts();
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderAllCarts();
  }

  /* UI animations */
  function animateAdd() {
    const bubble = document.createElement("div");
    bubble.className = "cart-bubble";
    bubble.innerText = "+1";
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 900);
  }

  /* Cart count*/
  function updateCartCount() {
    const count = cart.reduce((s, i) => s + Number(i.qty || 0), 0);

    qa(".cart-count").forEach(el => {
     
      if (el.tagName.toLowerCase() === "span" || el.tagName.toLowerCase() === "div") {
        el.textContent = count;
      } else {
        el.innerText = count;
      }
    });

    const headerSpan = q("header .cart-count, .header .cart-count");
    if (headerSpan) headerSpan.textContent = count;
  }

  /* BYOL handler */
  const byol = {
    base: null,
    milk: null,
    sweeteners: [],
    qty: 1,
    price: 60,
  };

  function updateBYOLFromDOM() {
    const baseEl = q(".byol-base:checked");
    const milkEl = q(".byol-milk:checked");
    const sweetEls = qa(".byol-sweet:checked, .byol-sweetner:checked, input.byol-sweet:checked");

    byol.base = baseEl ? baseEl.value : null;
    byol.milk = milkEl ? milkEl.value : null;
    byol.sweeteners = sweetEls.map(e => e.value);

    const qtyDisplay = q("#byol-qty-display, #byol-qty");
    if (qtyDisplay) {
      const n = safeNum(qtyDisplay.textContent || qtyDisplay.value);
      byol.qty = n > 0 ? n : 1;
    }
  }

  function renderBYOLSummary() {
    updateBYOLFromDOM();
    const sumBase = q("#sum-base");
    const sumMilk = q("#sum-milk");
    const sumSweet = q("#sum-sweet") || q("#sum-sweetner") || q("#sum-sweetner-display");
    const sumTotal = q("#sum-total") || q("#byol-total");

    if (sumBase) sumBase.textContent = byol.base || "None";
    if (sumMilk) sumMilk.textContent = byol.milk || "None";
    if (sumSweet) sumSweet.textContent = (byol.sweeteners.length ? byol.sweeteners.join(", ") : "None");
    if (sumTotal) sumTotal.textContent = currency(byol.price * (byol.qty || 1));
  }

  /* Render cart into order summary*/
  function renderAllCarts() {
    renderCartSidebar(); 
    renderCartMini();    
    updateCartCount();
  }

  function renderCartMini() {
 
    const mini = q("#cart-items");
    if (!mini) return;
    mini.innerHTML = "";
    if (!cart.length) {
      mini.innerHTML = "<p>Your cart is empty</p>";
      q("#order-total") && (q("#order-total").textContent = "0");
      return;
    }
    cart.forEach(it => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1">
            <b>${escapeHtml(it.name)}</b><br>
            ${it.meta ? `<small>${escapeHtml(it.meta)}</small><br>` : ""}
            <small>${currency(it.price)} each</small>
          </div>
          <div style="text-align:right">
            <div class="qty-box">
                <button class="qty-minus" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta || "")}">−</button>
                <span>${it.qty}</span>
                <button class="qty-plus" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta || "")}">+</button>
            </div>
            <div style="margin-top:6px">
              <button class="delete-item" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta || "")}">Remove</button>
            </div>
          </div>
        </div>
      `;
      mini.appendChild(row);
    });

    // update total if element exists
    const totalEl = q("#order-total") || q("#checkout-total") || q("#checkout-total-amount");
    if (totalEl) {
      totalEl.textContent = cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2);
    }
  }

  function renderCartSidebar() {
    const containers = [];
    const c1 = q("#order-summary");
    if (c1) containers.push(c1);
    const c2 = q("#order-side");
    if (c2) containers.push(c2);
    const c3 = q(".order-side");
    if (c3) containers.push(c3);
    const c4 = q("#cart-items");
    if (c4 && !containers.includes(c4)) containers.push(c4);
    const c5 = q("#order-summary-box");
    if (c5) containers.push(c5);

    containers.forEach(container => {
      container.innerHTML = "";
      if (!cart.length) {
        container.innerHTML = "<p>Your order is empty.</p>";
        const totalBox = q("#order-total");
        if (totalBox) totalBox.textContent = "R0.00";
        return;
      }

      let total = 0;
      cart.forEach(it => {
        total += it.price * it.qty;
        const el = document.createElement("div");
        el.className = "cart-item";
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;justify-content:space-between">
            <div class="meta">
              <b>${escapeHtml(it.name)}</b>
              ${it.meta ? `<div class="meta-sub">${escapeHtml(it.meta)}</div>` : ""}
              <div>${currency(it.price)}</div>
            </div>
            <div style="text-align:right">
              <div class="qty-box">
                <button class="qty-minus" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta||"")}">−</button>
                <span>${it.qty}</span>
                <button class="qty-plus" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta||"")}">+</button>
              </div>
              <div style="margin-top:6px">
                <button class="delete-item" data-name="${escapeAttr(it.name)}" data-meta="${escapeAttr(it.meta||"")}">Remove</button>
              </div>
            </div>
          </div>
        `;
        container.appendChild(el);
      });

      const totalDiv = document.createElement("div");
      totalDiv.className = "cart-summary";
      totalDiv.innerHTML = `<div><b>Total:</b> <span id="order-total">${currency(total)}</span></div>`;
      container.appendChild(totalDiv);
    });


    const orderTotalEl = q("#order-total");
    if (orderTotalEl) {
      orderTotalEl.textContent = currency(cart.reduce((s,i)=>s+i.price*i.qty,0));
    }
  }

  /*Escape helpers*/
  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /*Menu card wiring*/
  function wireMenuCards() {
    // For each .menu-item or .card/menu-item from your pages:
    qa(".menu-item, .card, .menu-item2").forEach(card => {
      // find an add button inside
      const addBtn = card.querySelector(".add-btn, .add-to-cart, button.add-btn, .add-button");
      const hiddenInput = card.querySelector("input[type='checkbox'][data-price], input[type='checkbox'][name='order[]'][data-price]");
      const priceAttr = hiddenInput ? hiddenInput.dataset.price : card.querySelector("[data-price]") ? card.querySelector("[data-price]").dataset.price : null;
      
      let price = priceAttr ? safeNum(priceAttr) : null;
      if (!price) {
        const priceNode = card.querySelector(".price");
        if (priceNode) {
          const match = priceNode.textContent.match(/(\d+(\.\d+)?)/);
          if (match) price = safeNum(match[1]);
        }
      }

     
      const name = hiddenInput ? (hiddenInput.value || hiddenInput.dataset.name) : (card.dataset.name || (card.querySelector(".title") ? card.querySelector(".title").textContent.trim() : (card.querySelector("b") ? card.querySelector("b").textContent.trim() : "Item")));

      // quantity controls inside card 
      const qtyControls = card.querySelector(".qty-controls");
      const qtyNumberEl = card.querySelector(".qty-number");
      const plusBtn = card.querySelector(".qty-plus");
      const minusBtn = card.querySelector(".qty-minus");

      
      if (!qtyControls && addBtn) {
        const wrapper = document.createElement("div");
        wrapper.className = "qty-controls";
        wrapper.style.display = "none";
        wrapper.innerHTML = `<button class="qty-minus">−</button><span class="qty-number">0</span><button class="qty-plus">+</button>`;
        addBtn.after(wrapper);
      }

      // reselect after possible creation
      const qtyControlsFinal = card.querySelector(".qty-controls");
      const qtyNum = card.querySelector(".qty-number");
      const plus = card.querySelector(".qty-plus");
      const minus = card.querySelector(".qty-minus");

      // When add button clicked: increment qty, reveal controls, add to cart
      if (addBtn) {
        addBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          // show qty controls
          if (qtyControlsFinal) qtyControlsFinal.style.display = "inline-flex";
          // increase displayed number
          if (qtyNum) {
            const n = safeNum(qtyNum.textContent || 0) + 1;
            qtyNum.textContent = n;
          }
          // add item to cart
          addItemToCart({ name: name.trim(), price: price || 0, qty: 1, meta: "" });
        });
      }

      // plus inside card
      if (plus) {
        plus.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (qtyNum) {
            const n = safeNum(qtyNum.textContent || 0) + 1;
            qtyNum.textContent = n;
          }
          addItemToCart({ name: name.trim(), price: price || 0, qty: 1, meta: "" });
        });
      }

      // minus inside card
      if (minus) {
        minus.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (qtyNum) {
            const n = Math.max(0, safeNum(qtyNum.textContent || 0) - 1);
            qtyNum.textContent = n;
            // remove one from cart
            updateItemQty(name.trim(), "", -1);
            if (n === 0 && qtyControlsFinal) qtyControlsFinal.style.display = "none";
          } else {
            updateItemQty(name.trim(), "", -1);
          }
        });
      }

    });
  }

  /*BYOL wiring*/
  function wireBYOL() {
    // update summary on change of any byol input
    const selectors = [".byol-base", ".byol-milk", ".byol-sweet", ".byol-sweetner", ".byol-sweetner", "input.byol-sweet"];
    selectors.forEach(sel => qa(sel).forEach(el => el.addEventListener("change", renderBYOLSummary)));

    // qty controls for byol
    const plus = q("#byol-plus") || q("#byol-plus-btn") || q("#byol-plus-button");
    const minus = q("#byol-minus") || q("#byol-minus-btn") || q("#byol-minus-button");
    const qtyDisplay = q("#byol-qty-display") || q("#byol-qty");

    if (plus) plus.addEventListener("click", () => {
      const cur = safeNum((qtyDisplay && (qtyDisplay.textContent || qtyDisplay.value)) || 1) + 1;
      if (qtyDisplay) { qtyDisplay.textContent = cur; qtyDisplay.value = cur; }
      renderBYOLSummary();
    });

    if (minus) minus.addEventListener("click", () => {
      const cur = Math.max(1, safeNum((qtyDisplay && (qtyDisplay.textContent || qtyDisplay.value)) || 1) - 1);
      if (qtyDisplay) { qtyDisplay.textContent = cur; qtyDisplay.value = cur; }
      renderBYOLSummary();
    });

    // Add BYOL to cart
    const addBtn = q("#add-byol") || q(".add-byol");
    if (addBtn) {
      addBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        updateBYOLFromDOM();
        // require base and milk
        if (!byol.base || !byol.milk) {
          alert("Please choose a base and milk for your latte.");
          return;
        }
        const meta = `Base: ${byol.base}; Milk: ${byol.milk}; Sweet: ${byol.sweeteners.length ? byol.sweeteners.join(", ") : "None"}`;
        addItemToCart({ name: `BYOL Latte`, price: byol.price, qty: byol.qty || 1, meta });
        alert("Custom latte added to cart!");
      });
    }
  }

  /* Order page interactions (delivery / payment modals)*/
  function wireCheckout() {
    // show/hide delivery block
    const methodEls = qa("input[name='method'], input[name='pickup'], input[name='delivery']");
    methodEls.forEach(r => r.addEventListener("change", (ev) => {
      const val = (ev.target.value || ev.target.dataset.value || "").toString().toLowerCase();
      const deliveryBlock = q("#delivery-block") || q("#delivery-address") || q("#address-container") || q("#delivery-address-block");
      if (!deliveryBlock) return;
      if (val.includes("delivery")) {
        deliveryBlock.style.display = "block";
      } else {
        deliveryBlock.style.display = "none";
      }
    }));

    // radio or buttons for payment
    const payRadios = qa("input[name='payment']");
    payRadios.forEach(p => p.addEventListener("change", (ev) => {
      handlePaymentSelection(ev.target.value);
    }));

    // if some pages used buttons instead of radio - wire them
    const payCardBtn = q("#pay-card") || q("#pay-card-btn");
    const payCashBtn = q("#pay-cash") || q("#pay-cash-btn");
    const payOnlineBtn = q("#pay-online") || q("#pay-online-btn");

    if (payCashBtn) payCashBtn.addEventListener("click", () => handlePaymentSelection("Cash"));
    if (payCardBtn) payCardBtn.addEventListener("click", () => handlePaymentSelection("Card"));
    if (payOnlineBtn) payOnlineBtn.addEventListener("click", () => handlePaymentSelection("Online"));

    // Place order button (form submit)
    const placeBtn = q("#place-order") || q("#pay-submit") || q("#place-order-btn");
    if (placeBtn) {
      placeBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        // default to reading selected payment radio
        const selected = q("input[name='payment']:checked");
        const method = selected ? selected.value : (q("#pay-card") ? "Card" : (q("#pay-online") ? "Online" : "Cash"));
        handlePaymentSelection(method);
      });
    }

    // modal close buttons
    qa(".close-modal, .modal .close").forEach(btn => btn.addEventListener("click", (ev) => {
      const modal = ev.target.closest(".modal");
      if (modal) modal.style.display = "none";
    }));

    // process card / online buttons inside modals (fake processing)
    const processCard = q("#card-pay") || q(".process-card") || q("#pay-submit");
    const processOnline = q("#online-pay") || q(".process-online");
    if (processCard) processCard.addEventListener("click", (ev) => {
      ev.preventDefault();
      fakeProcessPayment("Card");
    });
    if (processOnline) processOnline.addEventListener("click", (ev) => {
      ev.preventDefault();
      fakeProcessPayment("Online");
    });

    // close modal if clicked outside
    qa(".modal").forEach(modal => {
      modal.addEventListener("click", (ev) => {
        if (ev.target === modal) modal.style.display = "none";
      });
    });
  }

  function handlePaymentSelection(method) {
    method = (method || "").toString();
    if (!method) return;
    if (/cash/i.test(method)) {
      alert("Money will be paid on delivery.");
      // optionally clear cart or navigate
      return;
    }
    if (/card/i.test(method)) {
      const cardModal = q("#card-modal") || q(".modal#card-modal") || q(".modal-card");
      if (cardModal) cardModal.style.display = "flex";
      else fakeProcessPayment("Card");
      return;
    }
    if (/online/i.test(method)) {
      const onlineModal = q("#online-modal") || q(".modal#online-modal") || q(".modal-online");
      if (onlineModal) onlineModal.style.display = "flex";
      else fakeProcessPayment("Online");
      return;
    }
  }

  function fakeProcessPayment(type) {
    const confirmMsg = `Processing ${type} payment...`;
    // show modal-backdrop if exists
    const backdrop = q("#modal-backdrop");
    if (backdrop) backdrop.style.display = "flex";
    // small fake delay
    setTimeout(() => {
      if (backdrop) backdrop.style.display = "none";
      // 85% success
      const ok = Math.random() < 0.85;
      if (ok) {
        const sound = q("#ding-sound");
        if (sound && typeof sound.play === "function") { sound.currentTime = 0; sound.play().catch(()=>{}); }
        alert(`${type} payment approved! Thank you — your order is confirmed.`);
        clearCart();
        // close modals
        qa(".modal").forEach(m => (m.style.display = "none"));
        // navigate home if desired
        if (location.pathname && !location.pathname.endsWith("index.html")) {
          // optional redirect to home
          setTimeout(() => { try { location.href = "index.html"; } catch (e) {} }, 700);
        }
      } else {
        alert(`${type} payment declined. Please try another method.`);
      }
    }, 900);
  }

  /* Global document listeners for dynamic controls*/
  function wireGlobalClicks() {
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      // qty plus/minus in rendered lists
      if (t.matches(".qty-plus")) {
        const name = t.dataset.name || t.getAttribute("data-name") || (t.closest("[data-name]") && t.closest("[data-name]").dataset.name);
        const meta = t.dataset.meta || t.getAttribute("data-meta") || "";
        if (name) updateItemQty(name, meta, +1);
      }

      if (t.matches(".qty-minus")) {
        const name = t.dataset.name || t.getAttribute("data-name") || (t.closest("[data-name]") && t.closest("[data-name]").dataset.name);
        const meta = t.dataset.meta || t.getAttribute("data-meta") || "";
        if (name) updateItemQty(name, meta, -1);
      }

      if (t.matches(".delete-item")) {
        const name = t.dataset.name || t.getAttribute("data-name") || "";
        const meta = t.dataset.meta || t.getAttribute("data-meta") || "";
        if (name) {
          removeItem(name, meta);
        }
      }
    });
  }

  /* Initialization*/
  function init() {
    loadCart();
    wireMenuCards();
    wireBYOL();
    wireCheckout();
    wireGlobalClicks();
    renderAllCarts();
    renderBYOLSummary();

    
    qa("input.byol-base, input.byol-milk, input.byol-sweet, input.byol-sweetner").forEach(i => i.addEventListener("change", renderBYOLSummary));

    
    renderAllCarts();

    
    qa("button.add-btn, button.add-to-cart").forEach(b => {
      b.addEventListener("keydown", (e) => { if (e.key === "Enter") b.click(); });
    });

    
    qa("input[type='checkbox'][name='order[]']").forEach(chk => {
      chk.addEventListener("change", (ev) => {
        const price = safeNum(chk.dataset.price || 0);
        const name = chk.value || chk.dataset.name || "Item";
        if (chk.checked) addItemToCart({ name, price, qty: 1, meta: "" });
      });
    });

    
    const hiddenByolChk = q("#byolDrink");
    if (hiddenByolChk) {
      qa(".byol-base, .byol-milk, .byol-sweet, .byol-sweetner").forEach(i => i.addEventListener("change", () => {
        hiddenByolChk.checked = true;
      }));
    }

    
    const selectedMethod = q("input[name='method']:checked");
    if (selectedMethod) {
      const ev = new Event("change");
      selectedMethod.dispatchEvent(ev);
    }
  }

  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

