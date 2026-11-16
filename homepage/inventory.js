document.addEventListener("DOMContentLoaded", () => {
  // ===== Existing Stock In / Out Logic =====
  const stockInCard = document.getElementById("stockin");
  const stockOutCard = document.getElementById("stockout");
  const stockInModal = document.getElementById("stockInModal");
  const closeModal = document.getElementById("closeModal");
  const productCards = document.getElementById("productCards");

  const updateModalHeader = (type) => {
    const modalHeader = document.querySelector("#stockInModal h2");
    if (modalHeader) modalHeader.textContent = `${type} - Select Product`;
  };

  const showMessage = (message) => {
    productCards.innerHTML = `<p>${message}</p>`;
    stockInModal.classList.remove("hidden");
  };

  const fetchAction = async (action) => {
    try {
      productCards.innerHTML = "<p>Loading...</p>";
      const response = await fetch(`../homepage/inventory.php?action=${action}`);
      const data = await response.json();
      productCards.innerHTML = "";

      if (!data.success)
        return showMessage(
          `Error: ${data.error}${
            data.received ? ` (Received: ${data.received})` : ""
          }`
        );
      if (!data.data || Object.keys(data.data).length === 0)
        return showMessage("No products available");

      for (const category in data.data) {
        const catTitle = document.createElement("h3");
        catTitle.textContent = category;
        catTitle.classList.add("category-title");
        productCards.appendChild(catTitle);

        data.data[category].forEach((prod) => {
          const card = document.createElement("div");
          card.classList.add("product-card");
          card.innerHTML = `<strong>${prod.product_name}</strong>`;
          card.addEventListener("click", () => handleProductClick(action, prod));
          productCards.appendChild(card);
        });
      }

      stockInModal.classList.remove("hidden");
    } catch (err) {
      showMessage("Failed to load products.");
      console.error(err);
    }
  };

  const handleProductClick = async (action, prod) => {
    const promptMessage =
      action === "get_products"
        ? "Enter quantity to add (Stock In):"
        : "Enter quantity to deduct (Stock Out):";

    const quantity = parseInt(prompt(promptMessage), 10);
    if (isNaN(quantity) || quantity <= 0) return alert("Invalid quantity.");

    const targetAction = action === "get_products" ? "stock_in" : "stock_out";

    try {
      const response = await fetch(
        `../homepage/inventory.php?action=${targetAction}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: prod.product_id, quantity }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(
          `Successfully ${
            targetAction === "stock_in" ? "added to" : "deducted from"
          } inventory.`
        );
        stockInModal.classList.add("hidden");
      } else alert(data.error || "An error occurred.");
    } catch (err) {
      console.error(err);
      alert("Request failed.");
    }
  };

  stockInCard.addEventListener("click", () => {
    updateModalHeader("Stock In");
    fetchAction("get_products");
  });
  stockOutCard.addEventListener("click", () => {
    updateModalHeader("Stock Out");
    fetchAction("get_inventory");
  });
  closeModal.addEventListener("click", () => stockInModal.classList.add("hidden"));
  stockInModal.addEventListener("click", (e) => {
    if (e.target === stockInModal) stockInModal.classList.add("hidden");
  });

  // ===== Water Reserve Logic =====
  const waterReserveCard = document.getElementById("waterreserve");
  const waterReserveModal = document.getElementById("waterReserveModal");
  const closeReserveModal = document.getElementById("closeReserveModal");
  const reserveCards = document.getElementById("reserveCards");

  const showReserveMessage = (message) => {
    reserveCards.innerHTML = `<p>${message}</p>`;
    waterReserveModal.classList.remove("hidden");
  };

  const fetchWaterReserve = async () => {
    try {
      reserveCards.innerHTML = "<p>Loading...</p>";
      const response = await fetch(
        `../homepage/inventory.php?action=get_water_reserve`
      );
      const data = await response.json();
      reserveCards.innerHTML = "";

      if (!data.success) return showReserveMessage(`Error: ${data.error}`);
      if (!data.data || data.data.length === 0)
        return showReserveMessage("No water types available.");

      const displayedTypes = new Set();
      data.data.forEach((item) => {
        if (!displayedTypes.has(item.water_name)) {
          const card = document.createElement("div");
          card.classList.add("product-card");
          card.innerHTML = `<strong>${item.water_name}</strong>`;
          card.addEventListener("click", () => handleWaterReserveClick(item));
          reserveCards.appendChild(card);
          displayedTypes.add(item.water_name);
        }
      });

      waterReserveModal.classList.remove("hidden");
    } catch (err) {
      showReserveMessage("Failed to load water types.");
      console.error(err);
    }
  };

  const handleWaterReserveClick = async (item) => {
    const quantity_liters = parseFloat(
      prompt(`Enter quantity in liters to add for ${item.water_name}:`)
    );
    if (isNaN(quantity_liters) || quantity_liters <= 0)
      return alert("Invalid quantity.");

    try {
      const response = await fetch(
        `../homepage/inventory.php?action=add_water_reserve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watervariant_id: item.watervariant_id,
            quantity_liters,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(
          `Successfully added ${quantity_liters}L to Water Reserve for ${item.water_name}.`
        );
        waterReserveModal.classList.add("hidden");
      } else alert(data.error || "Failed to add to Water Reserve.");
    } catch (err) {
      console.error(err);
      alert("Request failed.");
    }
  };

  waterReserveCard.addEventListener("click", fetchWaterReserve);
  closeReserveModal.addEventListener("click", () =>
    waterReserveModal.classList.add("hidden")
  );
  waterReserveModal.addEventListener("click", (e) => {
    if (e.target === waterReserveModal) waterReserveModal.classList.add("hidden");
  });

  // ====== 📊 Display Inventory & Water Reserve Tables ======
  const inventoryTableBody = document.querySelector("#inventoryTable tbody");
  const waterReserveTableBody = document.querySelector("#waterReserveTable tbody");

  const loadTables = async () => {
    try {
      const invRes = await fetch(`../homepage/inventory.php?action=get_inventory_table`);
      const invData = await invRes.json();

      inventoryTableBody.innerHTML = "";
      if (invData.success && invData.data.length > 0) {
        invData.data.forEach((item) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.product_name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.last_updated || "—"}</td>
          `;
          inventoryTableBody.appendChild(tr);
        });
      } else {
        inventoryTableBody.innerHTML = `<tr><td colspan="4">No inventory found.</td></tr>`;
      }

      const resRes = await fetch(`../homepage/inventory.php?action=get_water_reserve_table`);
      const resData = await resRes.json();

      waterReserveTableBody.innerHTML = "";
      if (resData.success && resData.data.length > 0) {
        resData.data.forEach((item) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.water_name}</td>
            <td>${item.quantity_liters}</td>
            <td>${item.reserved_at || "—"}</td>
          `;
          waterReserveTableBody.appendChild(tr);
        });
      } else {
        waterReserveTableBody.innerHTML = `<tr><td colspan="3">No water reserves found.</td></tr>`;
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
    }
  };

  loadTables();

  const originalHandleProductClick = handleProductClick;
  handleProductClick = async (action, prod) => {
    await originalHandleProductClick(action, prod);
    loadTables();
  };

  const originalHandleWaterReserveClick = handleWaterReserveClick;
  handleWaterReserveClick = async (item) => {
    await originalHandleWaterReserveClick(item);
    loadTables();
  };

  
});
