document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const productList = document.getElementById("product-list");
  const cartTable = document.querySelector("#cart-table tbody");
  const grandTotalEl = document.getElementById("grand-total");
  const confirmBtn = document.getElementById("confirm-sale");

  // UPDATED DOM FIELDS TO MATCH HTML
  const fullNameInput = document.getElementById("delivery-fullname");
  const addressInput = document.getElementById("delivery-address");
  const phoneInput = document.getElementById("delivery-phone");
  const areaSelect = document.getElementById("delivery-area");

  // 🔵 ADDED: delivery-phone live validation
  phoneInput.addEventListener("input", function () {
    // Allow only digits
    this.value = this.value.replace(/[^0-9]/g, "");
    // Limit to 11 digits
    if (this.value.length > 11) this.value = this.value.slice(0, 11);

    // Red border if invalid, default border if valid
    if (this.value.startsWith("09") && this.value.length === 11) {
      this.style.border = "";
    } else {
      this.style.border = "2px solid red";
    }
  });

  // ✅ NEW: display area for delivery fee under the total
  let deliveryFeeDisplay = document.createElement("p");
  deliveryFeeDisplay.id = "delivery-fee-display";
  deliveryFeeDisplay.style = "margin-top: 5px;";
  deliveryFeeDisplay.textContent = "Delivery Fee: ₱0.00";
  grandTotalEl.parentNode.appendChild(deliveryFeeDisplay);

  let cart = [];

  loadProducts("water");
  loadAreas();

  /* =============================
     Fetch Delivery Areas
  ============================= */
  function loadAreas() {
    fetch("../homepage/forDelivery.php?action=areas")
      .then(res => res.json())
      .then(data => {
        if (!data.length) {
          areaSelect.innerHTML = `<option value="">No areas available</option>`;
          return;
        }
        areaSelect.innerHTML = `<option value="">Select Delivery Area</option>`;
        data.forEach(area => {
          areaSelect.innerHTML += `
            <option value="${area.deliveryprice_id}" data-fee="${area.delivery_fee}">
              ${area.area_name} - ₱${parseFloat(area.delivery_fee).toFixed(2)}
            </option>`;
        });
      })
      .catch(err => console.error("Area Load Error:", err));
  }

  /* =============================
     Update Delivery Fee on Area Selection
  ============================= */
  areaSelect.addEventListener("change", () => {
    let fee = 0;

    const selectedOption = areaSelect.options[areaSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.fee) {
      fee = parseFloat(selectedOption.dataset.fee);
    }

    deliveryFeeDisplay.textContent = `Delivery Fee: ₱${fee.toFixed(2)}`;
  });

  /* =============================
     Tab Click Handling
  ============================= */
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const category = tab.dataset.tab;
      loadProducts(category);
    });
  });

  /* =============================
     Fetch Products
  ============================= */
  function loadProducts(category) {
    productList.innerHTML = `<p class="loading">Loading ${category} products...</p>`;

    fetch(`../homepage/forDelivery.php?category=${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          productList.innerHTML = `<p class="error">${data.error}</p>`;
          return;
        }
        if (!data.length) {
          productList.innerHTML = `<p class="empty">No ${category} products available.</p>`;
          return;
        }

        productList.innerHTML = data.map(product => `
          <div class="card ${category}"
               data-product-id="${product.product_id || ''}" 
               data-watervariant-id="${product.watervariant_id || ''}"
               data-name="${product.product_name}" 
               data-price="${product.unit_price}"
               data-quantity="${product.quantity || ''}">
            <h3>${product.product_name}</h3>
            <p>${product.description || 'No description available.'}</p>
            ${product.quantity ? `<p>Available: ${product.quantity}</p>` : ""}
            <div class="price">₱${parseFloat(product.unit_price).toFixed(2)}</div>
          </div>
        `).join("");

        attachCardListeners();
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        productList.innerHTML = `<p class="error">Error loading products. Please try again.</p>`;
      });
  }

  /* =============================
     Add Event Listeners to Cards
  ============================= */
  function attachCardListeners() {
    document.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", () => {
        addToCart(card.dataset);
      });
    });
  }

  /* =============================
     Cart Logic
  ============================= */
  function addToCart(item) {
    const activeCategory = document.querySelector(".tab.active")?.dataset.tab;

    const qtyInput = prompt(`Enter quantity for ${item.name}${activeCategory !== "water" ? ` (Available: ${item.quantity || '∞'})` : ''}:`);
    if (qtyInput === null) return;

    const qty = parseInt(qtyInput);
    if (isNaN(qty) || qty <= 0) {
      alert("⚠️ Please enter a valid quantity greater than 0.");
      return;
    }

    if (activeCategory !== "water") {
      const availableQty = parseInt(item.quantity) || Infinity;
      const existing = cart.find(p => p.product_id === parseInt(item.productId));
      const totalQty = existing ? existing.qty + qty : qty;

      if (totalQty > availableQty) {
        alert(`⚠️ Insufficient stock! Only ${availableQty - (existing ? existing.qty : 0)} left for ${item.name}.`);
        return;
      }
    }

    let useReserve = false;
    if (activeCategory === "water") {
      useReserve = confirm(`💧 Use water reserve for ${item.name}?`);
    }

    const existing = cart.find(p =>
      activeCategory === "water"
        ? p.watervariant_id === parseInt(item.watervariantId)
        : p.product_id === parseInt(item.productId)
    );

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        product_id: activeCategory === "water" ? null : parseInt(item.productId),
        watervariant_id: activeCategory === "water" ? parseInt(item.watervariantId) : null,
        name: item.name,
        price: parseFloat(item.price),
        qty: qty,
        useReserve: useReserve
      });
    }

    renderCart();
  }

  /* =============================
     Render Cart
  ============================= */
  function renderCart() {
    if (!cart.length) {
      cartTable.innerHTML = `<tr><td colspan="5">No items in cart.</td></tr>`;
      grandTotalEl.textContent = "0.00";
      return;
    }

    cartTable.innerHTML = cart.map((p, index) => `
      <tr>
        <td>${p.name} ${p.useReserve ? "<small>(using reserve)</small>" : ""}</td>
        <td>${p.qty}</td>
        <td>₱${p.price.toFixed(2)}</td>
        <td>₱${(p.qty * p.price).toFixed(2)}</td>
        <td><button class="remove-btn" data-index="${index}">❌</button></td>
      </tr>
    `).join("");

    const grandTotal = cart.reduce((sum, p) => sum + p.qty * p.price, 0);
    grandTotalEl.textContent = grandTotal.toFixed(2);

    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index);
        cart.splice(idx, 1);
        renderCart();
      });
    });
  }

  /* =============================
     Confirm Sale
  ============================= */
  confirmBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("No products selected.");
      return;
    }

    if (!fullNameInput.value || !addressInput.value || !phoneInput.value || !areaSelect.value) {
      alert("⚠️ Please fill in ALL delivery information.");
      return;
    }

    // 🔵 ADDED: phone validation before fetch
    if (!phoneInput.value.startsWith("09") || phoneInput.value.length !== 11) {
      phoneInput.style.border = "2px solid red";
      alert("⚠️ Phone number must:\n• Start with 09\n• Be exactly 11 digits");
      return; // stops fetch
    }

    const data = {
      items: cart.map(p => ({
        product_id: p.product_id,
        watervariant_id: p.watervariant_id,
        quantity: p.qty,
        useReserve: p.useReserve || false
      })),
      total: parseFloat(grandTotalEl.textContent),
      full_name: fullNameInput.value,
      address: addressInput.value,
      phone_number: phoneInput.value,
      deliveryprice_id: areaSelect.value
    };

    fetch("../homepage/forDelivery.php?action=save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {

          if (resp.total_amount) {
            grandTotalEl.textContent = parseFloat(resp.total_amount).toFixed(2);
          }

          alert("✅ Delivery successfully recorded!");
          cart = [];
          renderCart();
        } else {
          alert("❌ Error: " + resp.error);
        }
      })
      .catch(err => {
        console.error("Save sale error:", err);
        alert("An error occurred while saving the delivery.");
      });
  });

});
