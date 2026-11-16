document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".delivery-container");

  // Function to fetch and display deliveries
  function fetchDeliveries() {
    fetch("fetchDelivered.php")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          container.innerHTML = `<p style="text-align:center;">${data.error}</p>`;
          return;
        }

        container.innerHTML = ""; // Clear previous HTML

        data.deliveries.forEach(delivery => {
          const card = document.createElement("div");
          card.classList.add("delivery-card");

          // Map delivery items
          let itemsHTML = delivery.items.map(item => `
            <tr>
              <td>${item.product}</td>
              <td>${item.qty}</td>
              <td>₱${item.price.toFixed(2)}</td>
              <td>₱${item.total.toFixed(2)}</td>
            </tr>
          `).join("");

          // Delivery fee row
          if (delivery.delivery_fee_total > 0) {
            itemsHTML += `
              <tr>
                <td>Delivery Fee</td>
                <td>${delivery.delivery_qty}</td>
                <td>₱${delivery.delivery_fee.toFixed(2)}</td>
                <td>₱${delivery.delivery_fee_total.toFixed(2)}</td>
              </tr>
            `;
          }

          const deliveredDateTime = delivery.delivered_at 
            ? new Date(delivery.delivered_at).toLocaleString('en-PH', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', second: '2-digit' 
              }) 
            : '';

          card.innerHTML = `
            <div class="delivery-top">
              <div class="delivery-left">
                <img src="../assets/business_logo.jpg" alt="${delivery.shop_name}">
                <div class="delivery-info">
                  <h3>${delivery.shop_name}</h3>
                  <p><b>Contact No.:</b> ${delivery.contact_no}</p>
                  <p><b>Delivered Date & Time:</b> ${deliveredDateTime}</p>
                </div>
              </div>
              <div>
                <button class="toggle-receipt-btn">View Receipt</button>
              </div>
            </div>
            <div class="mini-receipt" style="display:none;">
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
              <p style="text-align:right; font-weight:600;">Grand Total: ₱${delivery.grand_total.toFixed(2)}</p>
            </div>
          `;

          container.appendChild(card);
        });

        // Toggle receipts
        const toggleBtns = document.querySelectorAll('.toggle-receipt-btn');
        toggleBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const receipt = btn.closest('.delivery-card').querySelector('.mini-receipt');
            if (receipt.style.display === 'block') {
              receipt.style.display = 'none';
              btn.textContent = 'View Receipt';
            } else {
              receipt.style.display = 'block';
              btn.textContent = 'Hide Receipt';
            }
          });
        });

      })
      .catch(err => {
        container.innerHTML = `<p style="text-align:center;">Failed to fetch delivered history.</p>`;
        console.error(err);
      });
  }

  // Initial fetch
  fetchDeliveries();

  // Refresh every 2 seconds
  setInterval(fetchDeliveries, 2000);
});
