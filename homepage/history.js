// ============================
// 🚀 Initialize History Page
// ============================
document.addEventListener("DOMContentLoaded", () => {
  initSidebarNavigation();
  initInventoryHistory();
  initWaterReserveHistory();
  initSalesHistory(); 
  initDeliveryHistory();
});

// ============================
// 📦 Inventory History Initialization
// ============================
function initInventoryHistory() {
  const inventoryCard = document.getElementById("inventoryHistoryCard");
  const main = document.querySelector(".main-content");
  if (!inventoryCard || !main) return;

  inventoryCard.addEventListener("click", async () => {
    await renderInventoryHistory(main);
  });
}

// ============================
// 📊 Render Inventory History Table
// ============================
async function renderInventoryHistory(container) {
  try {
    const response = await fetch(`../homepage/inventory.php?action=get_inventory_history`);
    const result = await response.json();

    if (!result.success) {
      container.innerHTML = `
        <header class="header-banner">
          <h2>Inventory Records</h2>
          <button id="backBtn" class="back-btn">⬅ Back</button>
        </header>
        <section class="history-section">
          <p class="text-red-500">Error: ${result.error || "Failed to load records"}</p>
        </section>
      `;
      document.getElementById("backBtn").onclick = () =>
        (window.location.href = "../homepage/history.html");
      return;
    }

    const data = result.data;

    container.innerHTML = `
      <header class="header-banner">
        <h2>Inventory Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>

      <section class="history-section">
        <div class="overflow-x-auto shadow-md rounded-lg">
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Product Name</th>
                <th class="border p-2 text-left">Quantity</th>
                <th class="border p-2 text-left">Category</th>
                <th class="border p-2 text-left">Action</th>
                <th class="border p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              ${
                data.length === 0
                  ? `            <td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">
              No records found.
            </td>`
                  : data
                      .map(
                        (row) => `
                <tr>
                  <td class="border p-2">${row.product_name}</td>
                  <td class="border p-2">${row.quantity}</td>
                  <td class="border p-2">${row.category}</td>
                  <td class="border p-2 capitalize">${row.action}</td>
                  <td class="border p-2">${row.transaction_date}</td>
                </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "../homepage/history.html";
    });
  } catch (error) {
    console.error("Error loading inventory history:", error);
    container.innerHTML = `
      <header class="header-banner">
        <h2>Inventory Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>
      <section class="history-section">
        <p class="text-red-500">Error loading data. Please check the console.</p>
      </section>
    `;
    document.getElementById("backBtn").onclick = () =>
      (window.location.href = "../homepage/history.html");
  }
}

// ============================
// 💧 Water Reserve History Initialization
// ============================
function initWaterReserveHistory() {
  const waterCard = document.getElementById("waterReserveCard");
  const main = document.querySelector(".main-content");
  if (!waterCard || !main) return;

  waterCard.addEventListener("click", async () => {
    await renderWaterHistory(main);
  });
}

// ============================
// 🌊 Render Water Reserve History Table
// ============================
async function renderWaterHistory(container) {
  try {
    const response = await fetch(`../homepage/inventory.php?action=get_water_history`);
    const result = await response.json();

    if (!result.success) {
      container.innerHTML = `
        <header class="header-banner">
          <h2>Water Reserve Records</h2>
          <button id="backBtn" class="back-btn">⬅ Back</button>
        </header>
        <section class="history-section">
          <p class="text-red-500">Error: ${result.error || "Failed to load records"}</p>
        </section>
      `;
      document.getElementById("backBtn").onclick = () =>
        (window.location.href = "../homepage/history.html");
      return;
    }

    const data = result.data;

    container.innerHTML = `
      <header class="header-banner">
        <h2>Water Reserve Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>

      <section class="history-section">
        <div class="overflow-x-auto shadow-md rounded-lg mt-6">
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Water Type</th>
                <th class="border p-2 text-left">Size</th>
                <th class="border p-2 text-left">Action</th>
                <th class="border p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              ${
                data.length === 0
                  ? `            <td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">
              No water reserve records found.
            </td>`
                  : data
                      .map(
                        (row) => `
                <tr>
                  <td class="border p-2">${row.water_name}</td>
                  <td class="border p-2">${row.size_label}</td>
                  <td class="border p-2 capitalize">${row.action}</td>
                  <td class="border p-2">${row.transaction_date}</td>
                </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "../homepage/history.html";
    });

  } catch (error) {
    console.error("Error loading water history:", error);
    container.innerHTML = `
      <header class="header-banner">
        <h2>Water Reserve Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>
      <section class="history-section">
        <p class="text-red-500">Error loading data. Check console.</p>
      </section>
    `;
    document.getElementById("backBtn").onclick = () =>
      (window.location.href = "../homepage/history.html");
  }
}

// ============================
// 📊 Sales History Initialization
// ============================
function initSalesHistory() {
  const salesCard = document.querySelector(".hcard.blue"); // Sales card
  const main = document.querySelector(".main-content");
  if (!salesCard || !main) return;

  salesCard.addEventListener("click", async () => {
    await renderSalesHistory(main);
  });
}

// ============================
// 📈 Render Sales History Table
// ============================
async function renderSalesHistory(container) {
  try {
    const response = await fetch(`../homepage/inventory.php?action=get_sales`);
    const result = await response.json();

    if (!result.success) {
      container.innerHTML = `
        <header class="header-banner">
          <h2>Sales Records</h2>
          <button id="backBtn" class="back-btn">⬅ Back</button>
        </header>
        <section class="history-section">
          <p class="text-red-500">Error: ${result.error || "Failed to load sales records"}</p>
        </section>
      `;
      document.getElementById("backBtn").onclick = () =>
        (window.location.href = "../homepage/history.html");
      return;
    }

    const data = result.data;

    container.innerHTML = `
      <header class="header-banner">
        <h2>Sales Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>

      <section class="history-section">
        <div class="overflow-x-auto shadow-md rounded-lg mt-6">
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Total Amount</th>
                <th class="border p-2 text-left">Sale Date</th>
                <th class="border p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              ${
                data.length === 0
                  ? `<tr>            <td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">
              No sales records found.
            </td></tr>`
                  : data.map(row => `
                    <tr>
                      <td class="border p-2">₱${parseFloat(row.total_amount).toFixed(2)}</td>
                      <td class="border p-2">${row.sale_date}</td>
                      <td class="border p-2">
                        <button class="details-btn" data-sale-id="${row.sale_id}">
                          Details
                        </button>
                      </td>
                    </tr>
                  `).join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "../homepage/history.html";
    });

    // Add click event to all Details buttons
    const detailButtons = container.querySelectorAll(".details-btn");
    detailButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const saleId = btn.getAttribute("data-sale-id");
        viewSaleDetails(saleId);
      });
    });

  } catch (error) {
    console.error("Error loading sales history:", error);
    container.innerHTML = `
      <header class="header-banner">
        <h2>Sales Records</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>
      <section class="history-section">
        <p class="text-red-500">Error loading data. Check console.</p>
      </section>
    `;
    document.getElementById("backBtn").onclick = () =>
      (window.location.href = "../homepage/history.html");
  }
}

// ============================
// 🔹 View Sale Details in Modal
// ============================
async function viewSaleDetails(saleId) {
  const modal = document.querySelector(".saleHistory");
  if (!modal) return;

  try {
    const response = await fetch(`../homepage/inventory.php?action=get_sale_details&sale_id=${saleId}`);
    const result = await response.json();

    if (!result.success) {
      modal.querySelector(".modal-content").innerHTML = `<p class="text-red-500 p-4">Error: ${result.error || "Failed to load sale details"}</p>`;
    } else {
      const data = result.data;

      if (data.length === 0) {
        modal.querySelector(".modal-content").innerHTML = `<p class="text-gray-500 p-4">No items found for this sale.</p>`;
      } else {
        const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

        modal.querySelector(".modal-content").innerHTML = `
          <h3 class="text-lg font-semibold mb-4">Sale Details (ID: ${saleId})</h3>
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Product</th>
                <th class="border p-2 text-left">Unit Price</th>
                <th class="border p-2 text-left">Quantity</th>
                <th class="border p-2 text-left">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td class="border p-2">${item.product}</td>
                  <td class="border p-2">₱${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td class="border p-2">${item.quantity}</td>
                  <td class="border p-2">₱${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p class="mt-2 font-semibold text-right">Total: ₱${totalAmount.toFixed(2)}</p>
          <button class="closeModal mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
        `;
      }
    }

    modal.style.display = "flex";

    const closeBtn = modal.querySelector(".closeModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

  } catch (error) {
    console.error("Error fetching sale details:", error);
    modal.querySelector(".modal-content").innerHTML = `<p class="text-red-500 p-4">Error loading sale details. Check console.</p>`;
    modal.style.display = "flex";
  }
}

// ============================
// 🚚 Delivery History Initialization
// ============================
function initDeliveryHistory() {
  const deliveryCard = document.querySelector(".hcard.yellow"); // Delivery card
  const main = document.querySelector(".main-content");
  if (!deliveryCard || !main) return;

  deliveryCard.addEventListener("click", async () => {
    await renderDeliveryHistory(main);
  });
}

// Helper function to convert string to Title Case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================
// 📦 Render Delivery History Table (Delivered Only)
// ============================
async function renderDeliveryHistory(container) {
  try {
    const response = await fetch(`../homepage/inventory.php?action=get_deliveries`);
    const result = await response.json();

    if (!result.success) {
      container.innerHTML = `
        <header class="header-banner">
          <h2>Delivered Deliveries</h2>
          <button id="backBtn" class="back-btn">⬅ Back</button>
        </header>
        <section class="history-section">
          <p class="text-red-500">Error: ${result.error || "Failed to load deliveries"}</p>
        </section>
      `;
      document.getElementById("backBtn").onclick = () =>
        (window.location.href = "../homepage/history.html");
      return;
    }

    const data = result.data;

    container.innerHTML = `
      <header class="header-banner">
        <h2>Delivered Deliveries</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>

      <section class="history-section">
        <div class="overflow-x-auto shadow-md rounded-lg mt-6">
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Full Name</th>
                <th class="border p-2 text-left">Address</th>
                <th class="border p-2 text-left">Phone</th>
                <th class="border p-2 text-left">Total Amount</th>
                <th class="border p-2 text-left">Status</th>
                <th class="border p-2 text-left">Created At</th>
                <th class="border p-2 text-left">Delivered At</th>
                <th class="border p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              ${
                data.length === 0
                  ? `<tr>            <td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">
              No delivered records found.
            </td></tr>`
                  : data.map(row => `
                    <tr>
                      <td class="border p-2">${toTitleCase(row.full_name)}</td>
                      <td class="border p-2">${toTitleCase(row.address)}</td>
                      <td class="border p-2">${row.phone_number}</td>
                      <td class="border p-2">₱${parseFloat(row.total_amount).toFixed(2)}</td>
                      <td class="border p-2 capitalize">${row.status}</td>
                      <td class="border p-2">${row.created_at}</td>
                      <td class="border p-2">${row.delivered_at || "-"}</td>
                      <td class="border p-2">
                        <button class="delivery-details-btn" data-delivery-id="${row.delivery_id}">
                          Details
                        </button>
                      </td>
                    </tr>
                  `).join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "../homepage/history.html";
    });

    const detailButtons = container.querySelectorAll(".delivery-details-btn");
    detailButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const deliveryId = btn.getAttribute("data-delivery-id");
        viewDeliveryDetails(deliveryId);
      });
    });

  } catch (error) {
    console.error("Error loading delivery history:", error);
    container.innerHTML = `
      <header class="header-banner">
        <h2>Delivered Deliveries</h2>
        <button id="backBtn" class="back-btn">⬅ Back</button>
      </header>
      <section class="history-section">
        <p class="text-red-500">Error loading data. Check console.</p>
      </section>
    `;
    document.getElementById("backBtn").onclick = () =>
      (window.location.href = "../homepage/history.html");
  }
}

// ============================
// 🔹 View Delivery Details in Modal
// ============================
async function viewDeliveryDetails(deliveryId) {
  const modal = document.querySelector(".saleHistory"); // Reuse modal
  if (!modal) return;

  try {
    const response = await fetch(`../homepage/inventory.php?action=get_delivery_items&delivery_id=${deliveryId}`);
    const result = await response.json();

    if (!result.success) {
      modal.querySelector(".modal-content").innerHTML = `<p class="text-red-500 p-4">Error: ${result.error || "Failed to load delivery details"}</p>`;
    } else {
      const data = result.data;

      if (data.length === 0) {
        modal.querySelector(".modal-content").innerHTML = `<p class="text-gray-500 p-4">No items found for this delivery.</p>`;
      } else {
        const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

        modal.querySelector(".modal-content").innerHTML = `
          <h3 class="text-lg font-semibold mb-4">Delivery Details (ID: ${deliveryId})</h3>
          <table class="min-w-full border border-gray-300 bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="border p-2 text-left">Product</th>
                <th class="border p-2 text-left">Unit Price</th>
                <th class="border p-2 text-left">Quantity</th>
                <th class="border p-2 text-left">Subtotal</th>
                <th class="border p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td class="border p-2">${item.product}</td>
                  <td class="border p-2">₱${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td class="border p-2">${item.quantity}</td>
                  <td class="border p-2">₱${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                  <td class="border p-2 capitalize">${item.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p class="mt-2 font-semibold text-right">Total: ₱${totalAmount.toFixed(2)}</p>
          <button class="closeModal mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
        `;
      }
    }

    modal.style.display = "flex";

    const closeBtn = modal.querySelector(".closeModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

  } catch (error) {
    console.error("Error fetching delivery details:", error);
    modal.querySelector(".modal-content").innerHTML = `<p class="text-red-500 p-4">Error loading delivery details. Check console.</p>`;
    modal.style.display = "flex";
  }
}
