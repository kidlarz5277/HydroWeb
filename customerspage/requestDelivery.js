document.addEventListener("DOMContentLoaded", () => {
    loadRequestedDeliveries();

    // 🔄 Auto-refresh every 1 second
    setInterval(loadRequestedDeliveries, 1000);
});

function loadRequestedDeliveries() {
    fetch("../customerspage/fetchReqDeliveries.php")
        .then(res => res.json())
        .then(data => {
            const container = document.querySelector(".dashboard-content");
            container.innerHTML = `<h2>Requested Deliveries</h2>`; // reset

            // Check if PHP returned an error
            if (data.error) {
                container.innerHTML += `<p style="text-align:center; color:white; margin-top:20px;">${data.error}</p>`;
                return;
            }

            if (!data.deliveries || data.deliveries.length === 0) {
                container.innerHTML += `
                    <p style="text-align:center; color:white; margin-top:20px;">
                        No requested deliveries found.
                    </p>`;
                return;
            }

            data.deliveries.forEach(delivery => {
                let receiptItems = delivery.items || [];
                let rows = "";

                // ✔ GRAND TOTAL NOW COMES FROM DB
                let grandTotal = parseFloat(delivery.total_amount) || 0;

                // ✔ Add product rows
                receiptItems.forEach(item => {
                    const total = item.qty * item.price;
                    rows += `
                        <tr>
                            <td>${item.product}</td>
                            <td>${item.qty}</td>
                            <td>₱${item.price}</td>
                            <td>₱${total}</td>
                        </tr>`;
                });

                // ✔ DELIVERY FEE DISPLAY WITH QUANTITY
                if (delivery.delivery_fee > 0 && delivery.delivery_qty > 0) {
                    const feeTotal = delivery.delivery_fee * delivery.delivery_qty;

                    rows += `
                        <tr>
                            <td>Delivery Fee</td>
                            <td>${delivery.delivery_qty}</td>
                            <td>₱${delivery.delivery_fee}</td>
                            <td>₱${feeTotal}</td>
                        </tr>`;
                }

                container.innerHTML += `
                <div class="delivery-card">
                    <div class="delivery-top">
                        <div class="delivery-left">
                            <img src="../assets/business_logo.jpg" alt="Station Logo">
                            <div class="delivery-info">
                                <h3>${delivery.shop_name}</h3>
                                <p><b>Address:</b> ${delivery.final_address}</p>
                                <p><b>Contact No.:</b> ${delivery.contact_no}</p>
                                <p><b>Status:</b> ${delivery.status}</p>
                            </div>
                        </div>

                        <div>
                            <button class="toggle-receipt-btn">View Receipt</button>
                            <button class="cancel-btn" data-id="${delivery.delivery_id}">
                                Cancel Delivery
                            </button>
                        </div>
                    </div>

                    <div class="mini-receipt" style="display:none;">
                        <table>
                            <thead>
                                <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                        <p style="text-align:right; margin-top:5px; font-weight:600;">
                            Grand Total: ₱${grandTotal}
                        </p>
                    </div>
                </div>`;
            });

            enableCardFunctions();
        })
        .catch(err => {
            console.error("Error fetching deliveries:", err);
            const container = document.querySelector(".dashboard-content");
            container.innerHTML += `<p style="text-align:center; color:white; margin-top:20px;">
                Failed to load deliveries. Please try again later.
            </p>`;
        });
}

function enableCardFunctions() {
    const container = document.querySelector(".dashboard-content");

    // ❗ Event Delegation — prevents duplicate listeners
    container.onclick = (e) => {

        // Toggle receipt
        if (e.target.classList.contains("toggle-receipt-btn")) {
            const btn = e.target;
            const receipt = btn.closest(".delivery-card").querySelector(".mini-receipt");

            const isHidden = receipt.style.display === "none";
            receipt.style.display = isHidden ? "block" : "none";
            btn.textContent = isHidden ? "Hide Receipt" : "View Receipt";
        }

        // Cancel button
        if (e.target.classList.contains("cancel-btn")) {
            const deliveryId = e.target.dataset.id;

            if (!confirm("Are you sure you want to cancel this delivery?")) return;

            fetch("../customerspage/cancelDelivery.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ delivery_id: deliveryId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Delivery cancelled!");
                    loadRequestedDeliveries(); // reload list
                } else {
                    alert("Error cancelling delivery.");
                }
            })
            .catch(err => {
                console.error("Error cancelling delivery:", err);
                alert("Error cancelling delivery.");
            });
        }
    };
}
