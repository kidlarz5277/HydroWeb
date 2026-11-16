document.addEventListener("DOMContentLoaded", () => {
  const toConfirmCard = document.getElementById("delivery-confirm");
  const pendingCard = document.getElementById("delivery-pending");
  const deliveredCard = document.getElementById("delivery-delivered");
  const mainContent = document.querySelector(".main-content");

  const tableContainer = document.createElement("div");
  tableContainer.classList.add("delivery-table-container");
  mainContent.appendChild(tableContainer);

  loadAllDeliveries();

  toConfirmCard.addEventListener("click", () => showTable("To Confirm"));
  pendingCard.addEventListener("click", () => showTable("Pending"));
  deliveredCard.addEventListener("click", () => showTable("Delivered"));

  let deliveriesData = {};

  function toTitleCase(str) {
    return str ? str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';
  }

  async function loadAllDeliveries() {
    tableContainer.innerHTML = `<p class="loading-text">Loading deliveries...</p>`;

    try {
      const res = await fetch("../homepage/getDeliveries.php");
      const result = await res.json();

      if (!result.success || !result.data) {
        tableContainer.innerHTML = `<p class="error-text">Failed to load deliveries.</p>`;
        return;
      }

      deliveriesData = result.data;

      updateCardCounts();

      showTable("To Confirm"); // default view
    } catch (error) {
      console.error("Error loading deliveries:", error);
      tableContainer.innerHTML = `<p class="error-text">Failed to load deliveries.</p>`;
    }
  }

  function updateCardCounts() {
    toConfirmCard.querySelector('h3').textContent = `To Confirm (${deliveriesData['To Confirm']?.length || 0})`;
    pendingCard.querySelector('h3').textContent = `Pending (${deliveriesData['Pending']?.length || 0})`;

    const today = new Date().toISOString().split("T")[0];
    const deliveredTodayCount = (deliveriesData['Delivered'] || []).filter(d => {
      const deliveredDate = d.delivered_at ? d.delivered_at.split(" ")[0] : "";
      return deliveredDate === today;
    }).length;

    deliveredCard.querySelector('h3').textContent = `Delivered (${deliveredTodayCount})`;
  }

  function showTable(status) {
    [toConfirmCard, pendingCard, deliveredCard].forEach(card => card.classList.remove("active"));
    if (status === "To Confirm") toConfirmCard.classList.add("active");
    else if (status === "Pending") pendingCard.classList.add("active");
    else if (status === "Delivered") deliveredCard.classList.add("active");

    let deliveries = deliveriesData[status] || [];

    if (status === "Delivered") {
      const today = new Date().toISOString().split("T")[0];
      deliveries = deliveries.filter(d => {
        const deliveredDate = d.delivered_at ? d.delivered_at.split(" ")[0] : "";
        return deliveredDate === today;
      });
    }

    if (deliveries.length === 0) {
      tableContainer.innerHTML = `<p class="no-data">No ${status.toLowerCase()} deliveries found.</p>`;
      return;
    }

    const table = document.createElement("table");
    table.classList.add("delivery-table");

    const thead = `
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Address</th>
          <th>Phone</th>
          <th>Total</th>
          <th>Details</th>
          ${(status === "To Confirm" || status === "Pending") ? "<th>Action</th>" : ""}
        </tr>
      </thead>
    `;

    const tbody = document.createElement("tbody");

    deliveries.forEach(delivery => {
      const customerName = toTitleCase(delivery.customer_name || delivery.full_name || '');
      const customerAddress = toTitleCase(delivery.address || delivery.home_address || '');
      const phoneNumber = delivery.phone_number || delivery.contact_no || '';

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${customerName}</td>
        <td>${customerAddress}</td>
        <td>${phoneNumber}</td>
        <td>₱${parseFloat(delivery.total || 0).toFixed(2)}</td>
        <td><button class="btn-details" data-id="${delivery.delivery_id}">Details</button></td>
        ${
          status === "To Confirm"
            ? `<td>
                 <button class="btn-to-confirm" id="to-confirm-${delivery.delivery_id}" data-id="${delivery.delivery_id}">To Confirm</button>
                 <button class="btn-cancel" id="cancel-${delivery.delivery_id}" data-id="${delivery.delivery_id}">Cancel</button>
               </td>`
            : (status === "Pending"
               ? `<td>
                    <button class="btn-delivered" data-id="${delivery.delivery_id}">Mark Delivered</button>
                    <button class="btn-cancel" data-id="${delivery.delivery_id}">Cancel</button>
                  </td>` 
               : "")
        }
      `;
      tbody.appendChild(tr);
    });

    table.innerHTML = thead;
    table.appendChild(tbody);
    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);

    if (status === "To Confirm") {
      attachToConfirmButtons();
      attachCancelButtons();
    } else if (status === "Pending") {
      attachDeliveredButtons();
      attachCancelButtons();
    }

    attachDetailsButtons();
  }

  // ---------- Attach Buttons Logic ----------

  function attachToConfirmButtons() {
    document.querySelectorAll(".btn-to-confirm").forEach(button => {
      button.addEventListener("click", async () => {
        const deliveryId = button.dataset.id;
        if (!confirm("Move this delivery to Pending?")) return;

        button.disabled = true;
        const originalText = button.textContent; 
        button.textContent = "Processing...";

        try {
          const success = await updateDeliveryStatus(deliveryId, "Pending");
          if (success) {
            alert("✅ Delivery moved to Pending!");
            loadAllDeliveries();
          }
        } catch (err) {
          console.error("Error updating delivery to Pending:", err);
          alert("⚠️ Failed to update delivery status.");
        } finally {
          button.disabled = false;
          button.textContent = originalText; 
        }
      });
    });
  }

  function attachDeliveredButtons() {
    document.querySelectorAll(".btn-delivered").forEach(button => {
      button.addEventListener("click", async () => {
        const deliveryId = button.dataset.id;
        if (!confirm("Mark this delivery as delivered?")) return;

        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "Processing...";

        try {
          const items = await getDeliveryItems(deliveryId);
          if (!items || items.length === 0) {
            alert("⚠️ No items found for this delivery.");
            return;
          }

          const success = await updateDeliveryStatus(deliveryId, "Delivered", items);
          if (success) {
            alert("✅ Delivery marked as delivered!");
            loadAllDeliveries();
          }
        } catch (err) {
          console.error("Error marking as delivered:", err);
          alert("⚠️ Failed to mark delivery as delivered.");
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  function attachCancelButtons() {
    document.querySelectorAll(".btn-cancel").forEach(button => {
      button.addEventListener("click", async () => {
        const deliveryId = button.dataset.id;
        if (!confirm("Cancel this delivery?")) return;

        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "Processing...";

        try {
          const res = await fetch(`../homepage/getDeliveries.php?action=cancel&delivery_id=${deliveryId}`);
          const result = await res.json();

          if (result.success) {
            alert("✅ Delivery cancelled!");
            loadAllDeliveries();
          } else {
            alert(result.error || "Failed to cancel delivery.");
          }
        } catch (err) {
          console.error("Error cancelling delivery:", err);
          alert("⚠️ Failed to cancel delivery.");
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  function attachDetailsButtons() {
    const modal = document.getElementById("deliveryModal");
    const modalBody = modal.querySelector(".modal-body");
    const closeBtn = modal.querySelector(".close");

    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
      if (event.target === modal) modal.style.display = "none";
    };

    document.querySelectorAll(".btn-details").forEach(button => {
      button.addEventListener("click", async () => {
        const deliveryId = button.dataset.id;

        try {
          const res = await fetch(`../homepage/getDeliveries.php?action=details&delivery_id=${deliveryId}`);
          const data = await res.json();

          if (!data.success) {
            alert(data.error || "Failed to fetch delivery details.");
            return;
          }

          if (!data.items || data.items.length === 0) {
            alert("No items found for this delivery.");
            return;
          }

          const customerName = toTitleCase(data.customer_name || data.full_name || '');
          const customerAddress = toTitleCase(data.address || data.home_address || '');
          const phoneNumber = data.phone_number || data.contact_no || '';

          let html = `
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Address:</strong> ${customerAddress}</p>
            <p><strong>Phone:</strong> ${phoneNumber}</p>
            <hr>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>`;

          data.items.forEach(item => {
            const productDisplay = item.product_display || item.product_name || item.watervariant_name || 'N/A';
            html += `<tr>
                      <td>${productDisplay}</td>
                      <td>${item.quantity || 0}</td>
                      <td>₱${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                      <td>${item.status || 'N/A'}</td>
                    </tr>`;
          });

          html += `</tbody></table>`;

          // ✅ Added delivery fee
          html += `<p style="margin-top: 10px; font-weight: bold;">Delivery Fee: ₱${parseFloat(data.delivery_fee || 0).toFixed(2)}</p>`;

          html += `<p style="margin-top: 5px; font-weight: bold;">Total: ₱${parseFloat(data.total || 0).toFixed(2)}</p>`;

          modalBody.innerHTML = html;
          modal.style.display = "block";

        } catch (err) {
          console.error("Error fetching delivery details:", err);
          alert("⚠️ Failed to fetch delivery details.");
        }
      });
    });
  }

  async function getDeliveryItems(deliveryId) {
    try {
      const res = await fetch(`../homepage/getDeliveries.php?action=details&delivery_id=${deliveryId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        return data.items.map(i => ({
          product_id: i.pricing_id,
          quantity: i.quantity
        }));
      } else {
        console.warn("No items found for delivery:", data);
        return [];
      }
    } catch (err) {
      console.error("Error fetching delivery items:", err);
      return [];
    }
  }

  async function updateDeliveryStatus(deliveryId, status, items = []) {
    try {
      const res = await fetch("../homepage/updateDeliveryStatus.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_id: deliveryId, status, items })
      });

      const result = await res.json();

      if (!result.success && result.error) {
        alert(result.error);
      }

      return result.success;
    } catch (err) {
      console.error("Error updating status:", err);
      alert("⚠️ Network error while updating delivery status.");
      return false;
    }
  }
});
