document.addEventListener("DOMContentLoaded", function () {

    // ===========================
    // FETCH CUSTOMER NAME (SESSION)
    // ===========================
    const customerNameEl = document.getElementById("customerName");
    if (customerNameEl) {
        fetch("../customerspage/getCustomerName.php")
            .then(response => response.json())
            .then(data => {
                customerNameEl.textContent = data.full_name || "Customer";
            })
            .catch(err => console.error("Error fetching customer name:", err));
    }

    // ======================================
    // DASHBOARD STATION LIST (KEEP ORIGINAL)
    // ======================================

    // Convert text to Title Case
    function toTitleCase(str) {
        if (!str) return "";
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    function formatTime(time) {
        if (!time) return "N/A";
        const [hour, minute] = time.split(":");
        let h = parseInt(hour);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${minute} ${ampm}`;
    }

    function isStationOpen(opening, closing) {
        if (!opening || !closing) return false;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [openHour, openMinute] = opening.split(":").map(Number);
        const [closeHour, closeMinute] = closing.split(":").map(Number);
        const openingTime = openHour * 60 + openMinute;
        const closingTime = closeHour * 60 + closeMinute;
        return currentTime >= openingTime && currentTime <= closingTime;
    }

    function getStatus(opening, closing) {
        return isStationOpen(opening, closing) ? "OPEN" : "CLOSED";
    }

    const dashboardContainer = document.querySelector(".dashboard-content");
    if (dashboardContainer) {
        fetch("../customerspage/dashboard.php")
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                data.forEach(station => {
                    const status = getStatus(station.opening_time, station.closing_time);
                    const statusClass = status === "OPEN" ? "status-open" : "status-closed";

                    const stationCard = document.createElement("a");
                    stationCard.href = `storeDetails.html?shop_name=${encodeURIComponent(station.shop_name)}`;
                    stationCard.classList.add("station-link");

                    stationCard.innerHTML = `
                        <div class="station-card">
                            <img src="../assets/business_logo.jpg" alt="Station Logo">
                            <div class="station-info">
                                <h3>${station.shop_name}</h3>
                                <p><b>Owner:</b> ${station.full_name}</p>
                                <p><b>Location:</b> ${station.business_address}</p>
                                <p><b>Contact No.:</b> ${station.contact_no || 'N/A'}</p>
                                <p><b>Operating Hours:</b> ${formatTime(station.opening_time)} - ${formatTime(station.closing_time)}</p>
                                <p><b>Status:</b> <span class="status-badge ${statusClass}">${status}</span></p>
                                <p><b>Available Delivery Service:</b> ${toTitleCase(station.delivery_areas) || 'None'}</p>
                            </div>
                        </div>
                    `;

                    // ====================================================
                    // NEW FEATURE: DISABLE CARD CLICK WHEN STATUS IS CLOSED
                    // ====================================================
                    if (status === "CLOSED") {
                        stationCard.removeAttribute("href");
                        stationCard.style.pointerEvents = "none";
                        stationCard.style.opacity = "0.6";
                        stationCard.style.cursor = "not-allowed";
                    }

                    dashboardContainer.appendChild(stationCard);
                });
            })
            .catch(error => console.error("Error fetching stations:", error));
    }

    // ======================================
    // STORE DETAILS PAGE SCRIPT
    // ======================================
    if (window.location.pathname.includes("storeDetails.html")) {

        const urlParams = new URLSearchParams(window.location.search);
        const shopName = urlParams.get('shop_name');

        const stationNameEl = document.getElementById("stationName");
        if (!shopName) {
            if (stationNameEl) stationNameEl.textContent = "Store not found";
            return;
        }

        if (stationNameEl) stationNameEl.textContent = shopName;

        // Fetch store details
        fetch(`../customerspage/getStoreDetails.php?shop_name=${encodeURIComponent(shopName)}`)
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (data.error) {
                        if (stationNameEl) stationNameEl.textContent = "Store not found";
                        return;
                    }
                    const stationHeaderImg = document.querySelector(".station-header img");
                    if (stationHeaderImg) stationHeaderImg.src = data.logo || "../assets/business_logo.jpg";
                    if (stationNameEl) stationNameEl.textContent = data.shop_name;
                } catch (err) {
                    console.error("Error parsing store data JSON:", text, err);
                }
            })
            .catch(err => console.error("Error fetching store data:", err));

        // Fetch store products
        fetch(`../customerspage/getStoreProducts.php?shop_name=${encodeURIComponent(shopName)}`)
            .then(res => res.text())
            .then(text => {
                try {
                    const products = JSON.parse(text);
                    if (!products || products.error) return;

                    const waterTypesTable = document.getElementById("waterTypesTable");
                    const containersTable = document.getElementById("containersTable");
                    const otherItemsTable = document.getElementById("otherItemsTable");

                    products.forEach(product => {

                        // ====================================================
                        // NEW RULE: Only show product_id items if quantity > 0
                        // Water variants (watervariant_id) are NOT affected
                        // ====================================================
                        if (product.product_id && Number(product.quantity) <= 0) {
                            return; // Skip container/other product with 0 quantity
                        }

                        // Water Types (water variants)
                        if (product.water_name && waterTypesTable) {
                            const size = product.volume_liters ? `${product.volume_liters} L` : '-';
                            const waterName = product.water_name || '-';
                            const price = product.unit_price ? `₱${product.unit_price}` : '-';
                            const row = document.createElement("tr");
                            row.innerHTML = `<td>${waterName}</td><td>${size}</td><td>${price}</td>`;
                            waterTypesTable.appendChild(row);

                        } else if (product.category === "Containers" && containersTable) {
                            const row = document.createElement("tr");
                            row.innerHTML = `<td>${product.product_name}</td><td>₱${product.unit_price}</td>`;
                            containersTable.appendChild(row);

                        } else if (product.category === "Others" && otherItemsTable) {
                            const row = document.createElement("tr");
                            row.innerHTML = `<td>${product.product_name}</td><td>₱${product.unit_price}</td>`;
                            otherItemsTable.appendChild(row);
                        }
                    });

                } catch (err) {
                    console.error("Error parsing store products JSON:", text, err);
                }
            })
            .catch(err => console.error("Error fetching store products:", err));

        // ====================================================
        // REQUEST DELIVERY BUTTON (DYNAMIC SHOP NAME)
        // ====================================================
        const requestBtn = document.getElementById("requestBtn");
        if (requestBtn && shopName) {
            requestBtn.href = `../customerspage/request_delivery_button.html?shop_name=${encodeURIComponent(shopName)}`;
        }
    }

}); // END DOMContentLoaded
