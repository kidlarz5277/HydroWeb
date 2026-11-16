// ===============================
// Get shop name from URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const shopName = urlParams.get("shop_name");
if (!shopName) alert("No shop name provided in URL.");

const productTypeEl = document.getElementById("productType");
const dynamicSection = document.getElementById("dynamicSection");
const subOptionGroup = document.getElementById("subOptionGroup");
const receiptBody = document.querySelector("#receiptTable tbody");
const grandTotalEl = document.getElementById("grandTotal");
const modal = document.getElementById("deliveryModal");
const modalContent = document.getElementById("modalContent");

let grandTotal = 0;
let receiptItems = [];
let shopProducts = { Water: {}, Container: {}, Items: {} }; // store fetched products

// ===============================
// Helper: Capitalize each word in address
// ===============================
function capitalizeAddress(str) {
    return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// ===============================
// Fetch products from backend
// ===============================
if (shopName) {
    fetch(`../customerspage/getStoreProducts.php?shop_name=${encodeURIComponent(shopName)}`)
        .then(res => res.json())
        .then(products => {
            products.forEach(p => {
                if (p.product_id && Number(p.quantity) <= 0) return;

                const pricing_id = p.pricing_id || p.product_id || null;

                if (p.category === "Containers") {
                    shopProducts.Container[p.product_name] = {
                        price: parseFloat(p.unit_price),
                        pricing_id: pricing_id
                    };
                } else if (p.category === "Others") {
                    shopProducts.Items[p.product_name] = {
                        price: parseFloat(p.unit_price),
                        pricing_id: pricing_id
                    };
                } else if (!p.category && p.water_name) { 
                    if (!shopProducts.Water[p.water_name]) shopProducts.Water[p.water_name] = {};

                    shopProducts.Water[p.water_name][p.volume_liters] = {
                        price: parseFloat(p.unit_price),
                        pricing_id: pricing_id
                    };
                }
            });
        })
        .catch(err => console.error("Error fetching shop products:", err));
}

// ===============================
// Product Type Selection
// ===============================
productTypeEl.addEventListener("change", () => {
    const type = productTypeEl.value;
    subOptionGroup.innerHTML = "";
    dynamicSection.style.display = "none";
    if (!type) return;
    dynamicSection.style.display = "flex";

    const label = document.createElement("label");
    label.textContent = type==="Water"?"Water Type":type==="Container"?"Container":"Item";
    const select = document.createElement("select");
    select.id="subOption";
    select.innerHTML=`<option value="">Select ${type==="Water"?"Type":type==="Container"?"Container":"Item"}</option>`;

    let options = [];
    if (type==="Water") options = Object.keys(shopProducts.Water);
    else if (type==="Container") options = Object.keys(shopProducts.Container);
    else options = Object.keys(shopProducts.Items);

    options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
    });

    subOptionGroup.appendChild(label);
    subOptionGroup.appendChild(select);

    if(type==="Water"){
        const sizeGroup = document.createElement("div");
        sizeGroup.classList.add("form-group");
        sizeGroup.id="sizeGroup";
        const sizeLabel = document.createElement("label");
        sizeLabel.textContent="Water Size:";
        const sizeSelect = document.createElement("select");
        sizeSelect.id="literSize";
        sizeSelect.innerHTML=`<option value="">Select Size</option>`;
        sizeGroup.appendChild(sizeLabel);
        sizeGroup.appendChild(sizeSelect);
        dynamicSection.insertBefore(sizeGroup, document.getElementById("quantity").parentElement);

        select.addEventListener("change", ()=> {
            sizeSelect.innerHTML=`<option value="">Select Size</option>`;
            const waterName = select.value;
            if(shopProducts.Water[waterName]){
                Object.keys(shopProducts.Water[waterName]).sort((a,b)=>b-a).forEach(size=>{
                    const opt = document.createElement("option");
                    opt.value = size;
                    opt.textContent = `${size} Liter`;
                    sizeSelect.appendChild(opt);
                });
            }
        });
    } else { 
        const sg=document.getElementById("sizeGroup"); 
        if(sg) sg.remove(); 
    }
});

// ===============================
// Add Item to Receipt
// ===============================
document.getElementById("addItemBtn").addEventListener("click", ()=> {
    const productType = productTypeEl.value;
    const subOption = document.getElementById("subOption")?.value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const literSize = document.getElementById("literSize")?.value;
    if(!productType||!subOption||quantity<=0||(productType==="Water"&&!literSize)) 
        return alert("Please complete all fields.");

    let price, pricing_id;

    if(productType==="Water") {
        price = shopProducts.Water[subOption][literSize].price;
        pricing_id = shopProducts.Water[subOption][literSize].pricing_id;
    }
    else if(productType==="Container") {
        price = shopProducts.Container[subOption].price;
        pricing_id = shopProducts.Container[subOption].pricing_id;
    }
    else {
        price = shopProducts.Items[subOption].price;
        pricing_id = shopProducts.Items[subOption].pricing_id;
    }

    const total = price*quantity;
    grandTotal += total;

    const row = document.createElement("tr");
    row.innerHTML = `<td>${productType}</td>
                     <td>${productType==="Water"?`${subOption} - ${literSize}L`:subOption}</td>
                     <td>${quantity}</td>
                     <td>₱${price.toFixed(2)}</td>
                     <td>₱${total.toFixed(2)}</td>
                     <td><button class="remove-btn">Remove</button></td>`;
    receiptBody.appendChild(row);
    grandTotalEl.textContent = "₱"+grandTotal.toFixed(2);

    receiptItems.push({ 
        productType, 
        subOption, 
        literSize, 
        quantity, 
        price, 
        total,
        pricing_id
    });

    row.querySelector(".remove-btn").addEventListener("click", ()=> {
        grandTotal -= total;
        row.remove();
        grandTotalEl.textContent="₱"+grandTotal.toFixed(2);
        receiptItems = receiptItems.filter(item => item.total !== total);
    });
});

// ===============================
// CHECK DELIVERY AVAILABILITY FUNCTION
// ===============================
function checkDeliveryAvailability(address = "") {
    const params = new URLSearchParams({ shop_name: shopName });
    if(address) params.append("address", address);
    return fetch(`checkDelivery.php?${params.toString()}`)
        .then(res => res.json())
        .catch(err => {
            console.error("Error checking delivery:", err);
            return { status: "error" };
        });
}

// ===============================
// Confirm Order Modal with Address Choice
// ===============================
document.getElementById("confirmBtn").addEventListener("click", async () => {
    if (grandTotal <= 0) return alert("No items to confirm.");

    modalContent.innerHTML = `
    <button class="close-modal" id="closeModal">&times;</button>
    <div class="modal-inner">
        <div class="modal-header">
            <h3>Delivery Information</h3>
        </div>
        <div id="deliveryWarningContainer"></div>
        <div id="addressChoice">
            <p>Please choose your delivery option:</p>
            <button id="useCurrentAddressBtn" class="btn">Use Current Address</button>
            <button id="inputNewAddressBtn" class="btn">Enter New Address</button>
        </div>
    </div>`;

    const closeModalBtn = document.getElementById("closeModal");
    const useCurrentAddressBtn = document.getElementById("useCurrentAddressBtn");
    const inputNewAddressBtn = document.getElementById("inputNewAddressBtn");

    closeModalBtn.addEventListener("click", () => modal.style.display = "none");

    const deliveryResult = await checkDeliveryAvailability();

    if(deliveryResult.status === "no_delivery") {
        useCurrentAddressBtn.style.background = "#d9534f";
        useCurrentAddressBtn.style.border = "1px solid #b52b27";

        useCurrentAddressBtn.addEventListener("click", () => {
            const warningBox = document.getElementById("deliveryWarningContainer");
            warningBox.innerHTML = `<p style="color:red;font-weight:700;text-align:center;margin-bottom:10px;">
                There is no available delivery in your area
            </p>`;
        });
    } else {
        useCurrentAddressBtn.addEventListener("click", () => {
            const currentAddress = capitalizeAddress(localStorage.getItem("userAddress") || "");
            const fullname = localStorage.getItem("userName") || "";
            const contact = localStorage.getItem("userContact") || "";
            const today = new Date().toISOString().split("T")[0];

            fetch("../customerspage/addDelivery.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: currentAddress,
                    full_name: fullname,
                    contact: contact,
                    date: today,
                    items: receiptItems,
                    shop_name: shopName
                })
            })
            .then(res => res.json())
            .then(resp => {
                if(resp.success){
                    modalContent.innerHTML = `<div class="success-box">
                        <i class="fa-solid fa-circle-check"></i>
                        <h3>Order Confirmed!</h3>
                        <p>Please wait for the station’s response. You’ll receive a notification once it’s approved/declined.</p>
                        <button onclick="location.href='RequestDelivery.html'" class="btn">Go to Requested Deliveries</button>
                    </div>`;
                }
            })
            .catch(err => console.error("Error adding delivery:", err));
        });
    }

    // ===============================
    // Enter New Address with Delivery Check and Close Button
    // ===============================
    inputNewAddressBtn.addEventListener("click", () => {
        modalContent.innerHTML = `<button class="close-modal" id="closeModal">&times;</button>
        <div class="modal-inner">
            <h3>Enter New Address</h3>
            <div id="newAddressWarning"></div>
            <input type="text" id="address" placeholder="Delivery Address" />
            <button id="submitNewAddressBtn" class="btn">Submit</button>
        </div>`;

        const closeModalBtnNew = document.getElementById("closeModal");
        closeModalBtnNew.addEventListener("click", () => modal.style.display = "none");

        const submitNew = document.getElementById("submitNewAddressBtn");
        const addressInput = document.getElementById("address");
        const warningBox = document.getElementById("newAddressWarning");

        submitNew.addEventListener("click", async () => {
            const newAddress = capitalizeAddress(addressInput.value.trim());
            if(!newAddress) return alert("Please enter an address.");

            const result = await checkDeliveryAvailability(newAddress);

            if(result.status === "no_delivery") {
                warningBox.innerHTML = `<p style="color:red;font-weight:700;text-align:center;margin-bottom:10px;">
                    There is no available delivery in this address
                </p>`;
            } else {
                const fullname = localStorage.getItem("userName") || "";
                const contact = localStorage.getItem("userContact") || "";
                const today = new Date().toISOString().split("T")[0];

                fetch("../customerspage/addDelivery.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        address: newAddress,
                        full_name: fullname,
                        contact: contact,
                        date: today,
                        items: receiptItems,
                        shop_name: shopName
                    })
                })
                .then(res => res.json())
                .then(resp => {
                    if(resp.success){
                        modalContent.innerHTML = `<div class="success-box">
                            <i class="fa-solid fa-circle-check"></i>
                            <h3>Order Confirmed!</h3>
                            <p>Please wait for the station’s response. You’ll receive a notification once it’s approved/declined.</p>
                            <button onclick="location.href='RequestDelivery.html'" class="btn">Go to Requested Deliveries</button>
                        </div>`;
                    }
                })
                .catch(err => console.error("Error adding delivery:", err));
            }
        });
    });

    modal.style.display = "flex";
});

// ===============================
// BACK BUTTON TO PREVIOUS STORE DETAILS
// ===============================
const backBtn = document.getElementById("backBtn");
if (backBtn) {
    backBtn.addEventListener("click", function () {
        const urlParams = new URLSearchParams(window.location.search);
        const shopName = urlParams.get("shop_name");
        if (shopName) {
            window.location.href = `storeDetails.html?shop_name=${encodeURIComponent(shopName)}`;
        } else {
            window.location.href = "index.html";
        }
    });
}
