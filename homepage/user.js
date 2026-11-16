// ============================
// 🚀 Initialize Dashboard on Page Load
// ============================
document.addEventListener("DOMContentLoaded", () => {
  initUserMenu();
  loadDashboardData();
  loadProfileData();
  initFeedbackSubmit();
  initSidebarNavigation();
  initPriceManagement();
  initSalesManagementCheck();
});

// ============================
// 🧭 User Menu Toggle
// ============================
function initUserMenu() {
  const userIcon = document.querySelector(".user-icon");
  const userMenu = document.getElementById("user-menu");
  if (!userIcon || !userMenu) return;

  userMenu.style.display = "none";
  userIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.style.display = userMenu.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target) && e.target !== userIcon) {
      userMenu.style.display = "none";
    }
  });
}

// ============================
// 📊 Load Dashboard Data
// ============================
async function loadDashboardData() {
  try {
    const response = await fetch("homepageData.php?" + Date.now());
    const data = await response.json();

    if (data.error) return (window.location.href = "../loginpage/index.html");

    document.getElementById("welcomeText").innerText = `Welcome, ${data.shop_name}!`;
    document.getElementById("todaySales").innerText = `₱${parseFloat(data.today_sales).toFixed(2)}`;
    document.getElementById("grossSales").innerText = `₱${parseFloat(data.gross_sales).toFixed(2)}`;
    document.getElementById("containerCount").innerText = data.container_count;
    document.getElementById("pendingDeliveries").innerText = data.pending_deliveries;
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}
setInterval(loadDashboardData, 10000);

// ============================
// 🧭 Sidebar Navigation
// ============================
function initSidebarNavigation() {
  document.querySelectorAll(".sidebar .nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (!href || href === "#" || link.id === "salesLink") return;
      window.location.href = href;
    });
  });
}

// ============================
// 👤 Load Profile Data
// ============================
async function loadProfileData() {
  try {
    const response = await fetch("../homepage/details.php");
    const data = await response.json();
    if (data.error) return (window.location.href = "../loginpage/index.html");

    const profileRight = document.querySelector(".profile-right");
    if (!profileRight) return;
    profileRight.innerHTML = `
      <p><strong>Name:</strong> ${data.full_name}</p>
      <p><strong>Address:</strong> ${data.address}</p>
      <p><strong>Contact No:</strong> ${data.contact_no}</p>
      <p><strong>Store Name:</strong> ${data.store_name}</p>
      <button class="edit-btn">Edit</button>
    `;
  } catch (err) {
    console.error("Error loading profile data:", err);
  }
}

// ============================
// 💬 Feedback Submission
// ============================
function initFeedbackSubmit() {
  const feedbackSection = document.querySelector(".feedback-section");
  if (!feedbackSection) return;

  const textarea = feedbackSection.querySelector("textarea");
  const submitBtn = feedbackSection.querySelector(".submit-btn");
  if (!textarea || !submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const message = textarea.value.trim();
    if (!message) return;

    try {
      const res = await fetch("../homepage/submitFeedback.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.success) textarea.value = "";
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  });
}

// ============================
// 🏷️ Price Management
// ============================
function initPriceManagement() {
  const main = document.querySelector(".main-content");
  if (!main) return;

  const cards = {
    container: document.getElementById("containertype"),
    delivery: document.getElementById("deliveryprice"),
    others: document.getElementById("othersprice"),
    water: document.getElementById("watertype")
  };

  if (cards.water) {
    cards.water.addEventListener("click", () => {
      initWaterTypePricing(); // ← your new function
    });
  }

  // 🧴 Container
  cards.container?.addEventListener("click", async () => {
    const res = await fetch("../homepage/getProductsByCategory.php?category=Containers");
    const data = await res.json();
    if (data.success) {
      renderPriceTable(
        main,
        "Container Type Price Management",
        data.products.map((p) => ({
          id: p.product_id,
          name: p.product_name,
          desc: p.description,
        }))
      );
      loadSavedPricing("product");
    }
  });

  // 🧩 Others
  cards.others?.addEventListener("click", async () => {
    const res = await fetch("../homepage/getProductsByCategory.php?category=Others");
    const data = await res.json();
    if (data.success) {
      renderPriceTable(
        main,
        "Other Items Price Management",
        data.products.map((p) => ({
          id: p.product_id,
          name: p.product_name,
          desc: p.description,
        }))
      );
      loadSavedPricing("product");
    }
  });

  // 🚚 Delivery
  cards.delivery?.addEventListener("click", () => renderDeliveryTable(main));
}

// ============================
// 🧩 Render Price Table
// ============================
function renderPriceTable(container, title, items) {
  container.innerHTML = `
    <header class="header-banner">
      <h2>${title}</h2>
      <button id="backBtn" class="back-btn">⬅ Back</button>
    </header>
    <section class="price-form-section">
      <table class="price-table">
        <thead><tr><th>Product</th><th>Description</th><th>Unit Cost (₱)</th><th>Unit Price (₱)</th><th>Status</th></tr></thead>
        <tbody>
          ${items
            .map(
              (i) => `
              <tr data-id="${i.id}">
                <td>${i.name}</td>
                <td>${i.desc}</td>
                <td><input type="number" step="0.01" class="cost-input" value="0.00"></td>
                <td><input type="number" step="0.01" class="price-input" value="0.00"></td>
                <td>
                  <label class="switch">
                    <input type="checkbox" class="status-toggle">
                    <span class="slider round"></span>
                  </label>
                  <span class="status-label">Not Available</span>
                </td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <div id="savedProductsDisplay" style="margin-top:20px; border-top:1px solid #ccc; padding-top:10px;"></div>
      <button id="saveChanges" class="save-btn">💾 Save Changes</button>
    </section>
  `;

  document.getElementById("backBtn").onclick = () => (window.location.href = "../homepage/price.html");
  document.getElementById("saveChanges").onclick = saveProductPrices;

  // 🟢 Handle switch toggle for availability
  container.querySelectorAll(".status-toggle").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const label = toggle.closest("td").querySelector(".status-label");
      if (toggle.checked) {
        label.textContent = "Available";
        label.style.color = "green";
      } else {
        label.textContent = "Not Available";
        label.style.color = "red";
      }
    });
  });
}

// ============================
// 🚚 Render Delivery Table & Pre-fill Saved Values
// ============================
async function renderDeliveryTable(container) {
  container.innerHTML = `
    <header class="header-banner">
      <h2>Delivery Price Management</h2>
      <button id="backBtn" class="back-btn">⬅ Back</button>
    </header>

    <section class="delivery-form-section">
      <table class="delivery-table">
        <thead>
          <tr>
            <th>Area Name</th>
            <th>Delivery Fee (₱)</th>
          </tr>
        </thead>
        <tbody id="deliveryTableBody"></tbody>
      </table>

      <!-- CONSTANTLY VISIBLE saved delivery areas -->
      <div id="savedDeliveryDisplay" style="margin-top:20px; border-top:1px solid #ccc; padding-top:10px;"></div>

      <div class="delivery-buttons">
        <button id="addRowBtn" class="add-btn">➕ Add Row</button>
        <button id="saveDeliveryBtn" class="dsave-btn">💾 Save Changes</button>
      </div>
    </section>
  `;

  const tableBody = document.getElementById("deliveryTableBody");

  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "../homepage/price.html";
  });

  document.getElementById("addRowBtn")?.addEventListener("click", () => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td><input type="text" placeholder="Enter area name" class="area-input"></td>
      <td><input type="number" step="0.01" placeholder="0.00" class="fee-input"></td>
    `;
    tableBody.appendChild(newRow);
  });

  document.getElementById("saveDeliveryBtn")?.addEventListener("click", saveDeliveryPrices);
  initSidebarNavigation();

  // ⚡ Immediately load saved delivery pricing to be constantly visible
  await loadSavedPricing('delivery');
}


// ============================
// 🔄 Load Saved Pricing
// ============================
async function loadSavedPricing(type) {
  try {
    const res = await fetch("../homepage/getPricingData.php?" + Date.now());
    const data = await res.json();
    if (data.error) return;

    // ============================
    // 💧 PRODUCT PRICING
    // ============================
    if (type === "product" && data.productPricing) {
      const display = document.getElementById("savedProductsDisplay");
      const rows = document.querySelectorAll(".price-table tbody tr");

      // ✅ Pre-fill all products
      rows.forEach((row) => {
        const product_id = Number(row.dataset.id);
        const productData = data.productPricing.find((p) => p.product_id === product_id);

        if (productData) {
          const costInput = row.querySelector(".cost-input");
          const priceInput = row.querySelector(".price-input");
          const toggle = row.querySelector(".status-toggle");
          const label = row.querySelector(".status-label");

          if (costInput) costInput.value = parseFloat(productData.unit_cost).toFixed(2);
          if (priceInput) priceInput.value = parseFloat(productData.unit_price).toFixed(2);

          if (toggle && label) {
            toggle.checked = productData.status === "Available";
            label.textContent = productData.status;
            label.style.color = toggle.checked ? "green" : "red";
          }
        }
      });

      // ✅ Filter only available products for saved display
      const availableProducts = data.productPricing.filter((p) => p.status === "Available");

      if (display) {
        if (availableProducts.length > 0) {
          display.innerHTML = `
            <h3>💾 Saved Product Pricing (Available Only)</h3>
            <table class="saved-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Cost (₱)</th>
                  <th>Unit Price (₱)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${availableProducts
                  .map(
                    (p) => `
                      <tr>
                        <td>${p.product_name}</td>
                        <td>${parseFloat(p.unit_cost).toFixed(2)}</td>
                        <td>${parseFloat(p.unit_price).toFixed(2)}</td>
                        <td style="color:green;">${p.status}</td>
                      </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          `;
        } else {
          display.innerHTML = `<p style="color:#888;">No available products at the moment.</p>`;
        }
      }
    }

    // ============================
    // 🚚 DELIVERY PRICING
    // ============================
    if (type === "delivery" && data.deliveryPricing) {
      const body = document.getElementById("deliveryTableBody");
      const display = document.getElementById("savedDeliveryDisplay");

      if (body && display) {
        body.innerHTML = data.deliveryPricing
          .map(
            (d) =>
              `<tr>
                <td><input type="text" class="area-input" value="${d.area_name}"></td>
                <td><input type="number" class="fee-input" value="${parseFloat(d.delivery_fee).toFixed(2)}"></td>
              </tr>`
          )
          .join("");

        display.innerHTML = `
          <h3>💾 Saved Delivery Areas</h3>
          <table class="saved-table">
            <thead>
              <tr><th>Area</th><th>Fee (₱)</th></tr>
            </thead>
            <tbody>
              ${data.deliveryPricing
                .map(
                  (d) => `
                    <tr>
                      <td>${d.area_name}</td>
                      <td>${parseFloat(d.delivery_fee).toFixed(2)}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    }
  } catch (err) {
    console.error("Error loading saved pricing:", err);
  }
}



// ============================
// 💾 Save Product Prices
// ============================
async function saveProductPrices() {
  const rows = document.querySelectorAll(".price-table tbody tr");
  const products = [];

  rows.forEach(row => {
    const product_id = Number(row.dataset.id);
    const unit_cost = parseFloat(row.querySelector(".cost-input").value);
    const unit_price = parseFloat(row.querySelector(".price-input").value);
    const product_name = row.querySelector("td:first-child").textContent;
    const status_toggle = row.querySelector(".status-toggle");
    const status = status_toggle.checked ? "Available" : "Not Available";

    if (!isNaN(unit_cost) && !isNaN(unit_price)) {
      products.push({ product_id, product_name, unit_cost, unit_price, status });
    }
  });

  if (products.length === 0) {
    alert("⚠️ Please enter at least one valid cost and price.");
    return;
  }

  const saveBtn = document.getElementById("saveChanges");
  if (saveBtn) {
    saveBtn.textContent = "💾 Saving...";
    saveBtn.disabled = true;
    saveBtn.style.backgroundColor = "#999";
    saveBtn.style.color = "#fff";
  }

  try {
    const response = await fetch("../homepage/saveSelection.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products }),
    });

    const text = await response.text();

    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      alert("⚠️ Session expired or server error. Please log in again.");
      window.location.href = "../loginpage/index.html";
      return;
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("❌ Invalid JSON from server:", text);
      alert("⚠️ Server returned invalid data. Please check PHP logs.");
      return;
    }

    if (result.success) {
      const displayContainer = document.getElementById("savedProductsDisplay");
      if (displayContainer) {
        displayContainer.innerHTML = `<p style="color:#666;">🔄 Updating saved pricing...</p>`;
        await loadSavedPricing('product');
      }

      if (saveBtn) {
        saveBtn.textContent = "✅ Saved!";
        saveBtn.style.backgroundColor = "#4caf50";
        saveBtn.style.color = "#fff";
      }

      setTimeout(() => {
        if (saveBtn) {
          saveBtn.textContent = "💾 Save Changes";
          saveBtn.style.backgroundColor = "";
          saveBtn.style.color = "";
          saveBtn.disabled = false;
        }
      }, 2000);
    } else {
      alert(result.error || "⚠️ Failed to save product pricing.");
      if (saveBtn) saveBtn.disabled = false;
    }
  } catch (error) {
    console.error("❌ Error saving product prices:", error);
    alert("❌ Error connecting to the server. Please try again.");
    if (saveBtn) {
      saveBtn.textContent = "💾 Save Changes";
      saveBtn.disabled = false;
      saveBtn.style.backgroundColor = "";
      saveBtn.style.color = "";
    }
  }
}


// ============================
// 💾 Save Delivery Prices
// ============================
async function saveDeliveryPrices() {
  const rows = document.querySelectorAll("#deliveryTableBody tr");
  const data = [];

  rows.forEach(row => {
    const area = row.querySelector(".area-input").value.trim();
    const fee = parseFloat(row.querySelector(".fee-input").value);
    if (area && !isNaN(fee)) data.push({ area_name: area, delivery_fee: fee });
  });

  if (data.length === 0) return alert("Please enter at least one valid area and fee.");

  try {
    const response = await fetch("../homepage/saveDeliveryPricing.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success) {
      await loadSavedPricing('delivery');
      const saveBtn = document.getElementById("saveDeliveryBtn");
      if (saveBtn) {
        saveBtn.textContent = "✅ Saved!";
        saveBtn.disabled = true;
        saveBtn.style.backgroundColor = "#4caf50";
        saveBtn.style.color = "#fff";
      }
    } else alert(result.error || "Failed to save delivery pricing.");
  } catch (error) {
    console.error("Error saving delivery data:", error);
    alert("Error saving delivery data.");
  }
}

// ============================
// 💧 Water Type Price Management
// ============================
async function initWaterTypePricing() {
  const main = document.querySelector(".main-content");

  main.innerHTML = `
    <header class="header-banner">
      <h2>Water Type Price Management</h2>
      <button id="backBtn" class="back-btn">⬅ Back</button>
    </header>

    <section class="water-type-section">
      <div id="waterTypeCards" class="water-card-container"></div>
      <div id="setupTableSection"></div>
      <div id="savedWaterPricingDisplay" class="saved-section"></div>
    </section>

    <!-- Floating Modal -->
    <div id="sizeModal" class="modal-overlay hidden">
      <div class="modal-content">
        <h3>Select Sizes for <span id="modalWaterName"></span></h3>
        <div id="sizeOptions" class="size-card-container"></div>
        <button id="doneSizeSelect" class="btn-primary">Done</button>
      </div>
    </div>

    <style>
:root {
    --primary-color: #0077cc;
    --primary-hover: #005fa3;
    --secondary-color: #87ceeb;
    --bg-light: #f4f8fb;
    --bg-card: #fff;
    --text-dark: #003366;
    --text-muted: #666;
    --border-light: #e0e0e0;
    --border-gray: #ccc;
    --disabled-color: #999;
    --success-color: #4caf50;
}

/* ============================ 💧 Water Type Price Management ============================ */
.water-type-section {
    background: var(--bg-light);
    padding: 2rem 3rem;
    animation: fadeIn 0.3s ease;
}

/* Water Type Cards */
#waterTypeCards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.water-card {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    border: 1px solid var(--border-light);
}

.water-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--secondary-color);
}

.water-card h4 {
    color: var(--text-dark);
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.water-card p {
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Modal Styling */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}

.modal-overlay.hidden {
    display: none;
}

.modal-content {
    background: var(--bg-card);
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.2);
    animation: fadeIn 0.3s ease;
}

.modal-content h3 {
    color: var(--text-dark);
    margin-bottom: 1rem;
}

#sizeOptions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-bottom: 1rem;
}

/* Size Cards */
.size-card {
    border: 1px solid var(--border-gray);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: #f9f9f9;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.size-card:hover {
    background: #e6f7ff;
    border-color: var(--primary-color);
}

.size-card.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.size-card.disabled {
    background: #f1f1f1;
    color: var(--disabled-color);
    pointer-events: none;
    opacity: 0.6;
}

/* Table Styling */
.setup-table, .saved-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-card);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.setup-table th, .saved-table th {
    background: var(--primary-color);
    color: white;
    text-align: center;
    padding: 12px;
    font-weight: 600;
    font-size: 0.95rem;
}

.setup-table td, .saved-table td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
}

.setup-table tr:hover, .saved-table tr:hover {
    background: #f2f8ff;
}

/* Inputs */
.setup-table input[type="text"],
.saved-table input[type="text"],
.setup-table input[type="number"],
.saved-table input[type="number"] {
    width: 90px;
    padding: 6px 8px;
    border: 1px solid var(--border-gray);
    border-radius: 6px;
    text-align: right;
    font-size: 0.9rem;
    transition: border-color 0.2s ease;
}

.setup-table input:focus,
.saved-table input:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 3px rgba(0,119,204,0.3);
}

/* Buttons */
.btn-primary, .btn-save {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.2s ease;
    margin-top: 1rem;
}

.btn-primary:hover, .btn-save:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
}

#doneSizeSelect {
    display: block;
    margin: 1rem auto 0;
}

/* Toggle Switch */
.switch {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: var(--success-color);
}

input:checked + .slider:before {
    transform: translateX(22px);
}

.status-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #333;
    margin-left: 6px;
}

/* Utility */
.hidden { display: none; }
.saved-section { margin-top: 2rem; }
.no-data { text-align: center; color: #777; padding: 1rem; font-size: 0.95rem; }

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Responsive tweaks */
@media (max-width: 600px) {
    #waterTypeCards { gap: 1rem; }
    .setup-table input, .saved-table input { width: 70px; }
}
</style>

  `;

  // 🔙 Back Button
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "../homepage/price.html";
  });

  const modal = document.getElementById("sizeModal");
  const modalWaterName = document.getElementById("modalWaterName");
  const sizeOptions = document.getElementById("sizeOptions");
  const doneSizeSelect = document.getElementById("doneSizeSelect");
  const setupSection = document.getElementById("setupTableSection");
  const savedDisplay = document.getElementById("savedWaterPricingDisplay");

  let selectedWater = null;
  let selectedSizes = [];

  // 1️⃣ Load Water Type Cards
  async function loadWaterTypes() {
    const res = await fetch(`../homepage/watertype.php?action=fetch_waters`);
    const json = await res.json();

    const container = document.getElementById("waterTypeCards");
    if (!json.success || !json.data.length) {
      container.innerHTML = "<p>No water types found.</p>";
      return;
    }

    container.innerHTML = "";
    json.data.forEach((type) => {
      const card = document.createElement("div");
      card.className = "water-card";
      card.innerHTML = `<h4>${type.water_name}</h4><p>${type.description || ""}</p>`;
      card.addEventListener("click", () => openSizeModal(type));
      container.appendChild(card);
    });
  }

  // 2️⃣ Open Modal
  async function openSizeModal(type) {
    selectedWater = type;
    selectedSizes = [];
    modalWaterName.textContent = type.water_name;
    modal.classList.remove("hidden");

    const res = await fetch(`../homepage/watertype.php?action=fetch_sizes`);
    const json = await res.json();

    const savedRes = await fetch(`../homepage/watertype.php?action=fetch_pricing`);
    const savedJson = await savedRes.json();
    const existingPricing = savedJson.success ? savedJson.data : [];

    sizeOptions.innerHTML = "";
    if (!json.success || !json.data.length) {
      sizeOptions.innerHTML = "<p>No sizes found.</p>";
      return;
    }

    json.data.forEach((size) => {
      const alreadyExists = existingPricing.some(
        (p) =>
          p.water_name === type.water_name &&
          parseFloat(p.volume_liters) === parseFloat(size.volume_liters)
      );

      const card = document.createElement("div");
      card.className = "size-card";
      card.textContent = `${size.size_label} (${size.volume_liters}L)`;

      if (alreadyExists) {
        card.classList.add("disabled");
        card.title = "Already priced — view in Saved Pricing section";
      } else {
        card.addEventListener("click", () => toggleSize(card, size));
      }

      sizeOptions.appendChild(card);
    });
  }

  // 3️⃣ Toggle Size Selection
  function toggleSize(card, size) {
    const exists = selectedSizes.find((s) => s.watersize_id === size.watersize_id);
    if (exists) {
      selectedSizes = selectedSizes.filter((s) => s.watersize_id !== size.watersize_id);
      card.classList.remove("selected");
    } else {
      selectedSizes.push(size);
      card.classList.add("selected");
    }
  }

  // 4️⃣ Build Setup Table
  doneSizeSelect.addEventListener("click", () => {
    modal.classList.add("hidden");
    buildSetupTable();
  });

  function buildSetupTable() {
    if (!selectedWater || !selectedSizes.length) return;

    let table = setupSection.querySelector(".setup-table tbody");
    if (!table) {
      setupSection.innerHTML = `
        <h4>Setup Pricing for ${selectedWater.water_name}</h4>
        <table class="setup-table">
          <thead>
            <tr><th>Size</th><th>Unit Cost (₱)</th><th>Unit Price (₱)</th><th>Status</th></tr>
          </thead>
          <tbody></tbody>
        </table>
        <button id="saveWaterPricingBtn" class="btn-save">💾 Save Changes</button>
      `;
      table = setupSection.querySelector("tbody");
      document.getElementById("saveWaterPricingBtn").addEventListener("click", saveWaterPricing);
    }

    selectedSizes.forEach((s) => {
      let existingRow = table.querySelector(
        `tr[data-water-id="${selectedWater.water_id}"][data-size-id="${s.watersize_id}"]`
      );
      if (!existingRow) {
        const row = document.createElement("tr");
        row.dataset.waterId = selectedWater.water_id;
        row.dataset.sizeId = s.watersize_id;
        row.innerHTML = `
          <td>${s.size_label} (${s.volume_liters}L)</td>
          <td><input type="number" class="unit-cost" value="0.00" disabled></td>
          <td><input type="number" class="unit-price" min="0" placeholder="0.00"></td>
          <td>
            <label class="switch">
              <input type="checkbox" checked>
              <span class="slider"></span>
            </label>
          </td>
        `;
        table.appendChild(row);
      }
    });

    selectedSizes = [];
  }

  // 5️⃣ Save Pricing (Bulk)
  async function saveWaterPricing() {
    const rows = document.querySelectorAll(".setup-table tbody tr");
    const payload = Array.from(rows).map((row) => ({
      water_id: parseInt(row.dataset.waterId),
      watersize_id: parseInt(row.dataset.sizeId),
      unit_cost: 0, // ✅ Always zero
      unit_price: parseFloat(row.querySelector(".unit-price").value || 0),
      status: row.querySelector("input[type='checkbox']").checked ? "Available" : "Not Available",
    }));

    if (!payload.some((p) => p.unit_price > 0)) {
      alert("Please enter at least one valid price.");
      return;
    }

    const formData = new FormData();
    formData.append("action", "bulk_save_pricing");
    formData.append("data", JSON.stringify(payload));

    const res = await fetch(`../homepage/watertype.php`, { method: "POST", body: formData });
    const json = await res.json();

    if (json.success) {
      alert("✅ Water pricing saved successfully!");
      setupSection.innerHTML = "";
      await loadSavedWaterPricing();
    } else {
      alert("❌ Failed to save pricing: " + (json.error || "Unknown error"));
    }
  }

  // 6️⃣ Display Saved Water Pricing
  async function loadSavedWaterPricing() {
    const res = await fetch(`../homepage/watertype.php?action=fetch_pricing`);
    const json = await res.json();

    if (!json.success || !json.data.length) {
      savedDisplay.innerHTML = "<p>No saved pricing yet.</p>";
      return;
    }

    savedDisplay.innerHTML = `
      <h4>📋 Saved Water Pricing</h4>
      <table class="saved-table">
        <thead>
          <tr>
            <th>Water Type</th>
            <th>Size</th>
            <th>Cost</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${json.data
            .map(
              (p) => `
            <tr data-id="${p.pricing_id}">
              <td>${p.water_name}</td>
              <td>${p.size_label} (${p.volume_liters}L)</td>
              <td><input type="number" value="0.00" disabled></td>
              <td><input type="number" class="edit-price" value="${p.unit_price}" min="0"></td>
              <td>
                <label class="switch">
                  <input type="checkbox" ${p.status === "Available" ? "checked" : ""}>
                  <span class="slider"></span>
                </label>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <button id="updatePricingBtn" class="btn-save">💾 Update Changes</button>
    `;

    document.getElementById("updatePricingBtn").addEventListener("click", updateExistingPricing);
  }

  // 7️⃣ Update Existing Pricing
  async function updateExistingPricing() {
    const rows = document.querySelectorAll(".saved-table tbody tr");
    const payload = Array.from(rows).map((r) => ({
      pricing_id: parseInt(r.dataset.id),
      unit_cost: 0, // ✅ Always zero
      unit_price: parseFloat(r.querySelector(".edit-price").value || 0),
      status: r.querySelector("input[type='checkbox']").checked ? "Available" : "Not Available",
    }));

    const formData = new FormData();
    formData.append("action", "update_existing_pricing");
    formData.append("data", JSON.stringify(payload));

    const res = await fetch(`../homepage/watertype.php`, { method: "POST", body: formData });
    const json = await res.json();

    if (json.success) {
      alert("✅ Pricing updated successfully!");
      await loadSavedWaterPricing();
    } else {
      alert("❌ Failed to update pricing: " + (json.error || ""));
    }
  }

  // 🚀 Initialize
  await loadWaterTypes();
  await loadSavedWaterPricing();
}

// ============================
// 🧭 Sales Management Check
// ============================
function initSalesManagementCheck() {
  const link = document.getElementById("salesLink");
  if (!link) return;

  link.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("../homepage/checkPricingSetup.php?" + Date.now());
      const data = await res.json();

      if (data.error) {
        alert("⚠️ " + data.error);
        return (window.location.href = "../loginpage/index.html");
      }

      if (!data.hasPricing) {
        alert("⚠️ Please set up your prices first before accessing Sales Management.");
        return (window.location.href = "../homepage/price.html");
      }

      window.location.href = "../homepage/sales.html";
    } catch (err) {
      console.error("Error verifying pricing setup:", err);
      alert("❌ Unable to verify pricing setup. Please try again later.");
    }
  });
}
