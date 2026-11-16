document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const productList = document.getElementById("product-list");
  const cartTable = document.querySelector("#cart-table tbody");
  const grandTotalEl = document.getElementById("grand-total");
  const confirmBtn = document.getElementById("confirm-sale");
  let cart = [];

  /* =============================
     Load Default Category
  ============================= */
  loadProducts("water");

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
     Fetch and Display Products
  ============================= */
  function loadProducts(category) {
    productList.innerHTML = `<p class="loading">Loading ${category} products...</p>`;

    fetch(`../homepage/fetchProducts.php?category=${encodeURIComponent(category)}`)
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

        // Generate clickable cards with correct data attributes
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

    // Only validate stock for non-water products
    if (activeCategory !== "water") {
      const availableQty = parseInt(item.quantity) || Infinity;
      const existing = cart.find(p => p.product_id === parseInt(item.productId));
      const totalQty = existing ? existing.qty + qty : qty;
      if (totalQty > availableQty) {
        alert(`⚠️ Insufficient stock! Only ${availableQty - (existing ? existing.qty : 0)} left for ${item.name}.`);
        return;
      }
    }

    // Ask if using water reserve (only for water tab)
    let useReserve = false;
    if (activeCategory === "water") {
      useReserve = confirm(`💧 Do you want to use your water reserve for ${item.name}?`);
    }

    // Add or update cart
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

    const data = {
      items: cart.map(p => ({
        product_id: p.product_id,
        watervariant_id: p.watervariant_id,
        quantity: p.qty,
        useReserve: p.useReserve || false
      })),
      total: parseFloat(grandTotalEl.textContent)
    };

    fetch("../homepage/fetchProducts.php?action=save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          alert("✅ Sale successfully recorded!");
          cart = [];
          renderCart();
        } else {
          alert("❌ Error: " + resp.error);
        }
      })
      .catch(err => {
        console.error("Save sale error:", err);
        alert("An error occurred while saving the sale.");
      });
  });
});
