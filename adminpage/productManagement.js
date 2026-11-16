document.addEventListener("DOMContentLoaded", () => {
  const productsContainer = document.querySelector(".sdashboard-cards");
  const addCard = document.getElementById("watermeter");

  if (!productsContainer || !addCard) {
    console.error("Required elements not found in the DOM");
    return;
  }

  // ---------- HELPER FUNCTIONS ----------
  const getIcon = (category) => {
    if (category === "Containers") return "🧴";
    if (category === "Others") return "🧰";
    return "📦";
  };

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  // ---------- CREATE MODALS ----------

  // Add Product Modal
  const addModal = document.createElement("div");
  addModal.className = "modal hidden";
  addModal.innerHTML = `
    <div class="modal-content">
      <h2>Add Product</h2>
      <label>Product Name</label>
      <input type="text" id="add_product_name" placeholder="Enter product name" />
      <label>Description</label>
      <textarea id="add_description" placeholder="Enter description"></textarea>
      <label>Category</label>
      <select id="add_category">
        <option value="">Select category</option>
        <option value="Containers">Containers</option>
        <option value="Others">Others</option>
      </select>
      <div class="modal-buttons">
        <button id="add_saveProduct">Save</button>
        <button id="add_cancelProduct">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(addModal);

  // Edit Product Modal
  const editModal = document.createElement("div");
  editModal.className = "modal hidden";
  editModal.innerHTML = `
    <div class="modal-content">
      <h2>Edit Product</h2>
      <label>Product Name</label>
      <input type="text" id="edit_product_name" />
      <label>Description</label>
      <textarea id="edit_description"></textarea>
      <label>Category</label>
      <select id="edit_category">
        <option value="">Select category</option>
        <option value="Containers">Containers</option>
        <option value="Others">Others</option>
      </select>
      <div class="modal-buttons">
        <button id="edit_saveProduct">Save</button>
        <button id="edit_cancelProduct">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);

  // ---------- MODAL EVENTS ----------

  // Show Add Modal
  addCard.addEventListener("click", () => addModal.classList.remove("hidden"));
  // Hide Add Modal
  document.getElementById("add_cancelProduct").addEventListener("click", () => addModal.classList.add("hidden"));
  // Hide Edit Modal
  document.getElementById("edit_cancelProduct").addEventListener("click", () => editModal.classList.add("hidden"));

  // ---------- ATTACH CARD ACTIONS ----------
  const attachCardActions = (card, product) => {
    const actions = document.createElement("div");
    actions.className = "card-actions hidden";
    actions.innerHTML = `
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;
    card.appendChild(actions);

    card.addEventListener("click", () => actions.classList.toggle("hidden"));

    // Edit button
    actions.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      const editName = document.getElementById("edit_product_name");
      const editDesc = document.getElementById("edit_description");
      const editCategory = document.getElementById("edit_category");

      // Populate modal fields
      editName.value = product.product_name;
      editDesc.value = product.description || "";
      editCategory.value = product.category || "";
      editModal.classList.remove("hidden");

      const saveBtn = document.getElementById("edit_saveProduct");
      const saveHandler = () => {
        let name = editName.value.trim();
        let desc = editDesc.value.trim();
        let cat = editCategory.value;

        if (!name || !desc || !cat) {
          alert("Please fill in all fields.");
          return;
        }

        // Convert to title case
        name = toTitleCase(name);
        cat = toTitleCase(cat);

        fetch("manageProducts.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.product_id,
            product_name: name,
            description: desc,
            category: cat
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            // Update card immediately
            card.querySelector("h3").textContent = name;
            card.querySelector("p").textContent = cat;
            card.querySelector(".card-icon").textContent = getIcon(cat); // Update icon
            editModal.classList.add("hidden");
            alert("Product updated successfully!");
            saveBtn.removeEventListener("click", saveHandler);
          } else {
            alert("Error updating product: " + data.message);
          }
        })
        .catch(err => console.error(err));
      };

      saveBtn.replaceWith(saveBtn.cloneNode(true));
      document.getElementById("edit_saveProduct").addEventListener("click", saveHandler);
    });

    // Delete button
    actions.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (!product.product_id) { alert("Cannot delete: missing product_id"); return; }
      if (confirm("Delete this product?")) {
        fetch("manageProducts.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.product_id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            card.remove();
          } else {
            alert("Error: " + data.message);
          }
        })
        .catch(err => console.error(err));
      }
    });
  };

  // ---------- LOAD PRODUCTS ----------
  fetch("manageProducts.php")
    .then(res => res.json())
    .then(products => {
      products.forEach(p => {
        const card = document.createElement("div");
        card.className = "scard green";
        card.innerHTML = `
          <div class="card-icon">${getIcon(p.category)}</div>
          <h3>${toTitleCase(p.product_name)}</h3>
          <p>${toTitleCase(p.category)}</p>
        `;
        productsContainer.insertBefore(card, addCard);
        attachCardActions(card, p);
      });
    })
    .catch(err => console.error("Error fetching products:", err));

  // ---------- ADD PRODUCT ----------
  document.getElementById("add_saveProduct").addEventListener("click", () => {
    let name = document.getElementById("add_product_name").value.trim();
    const desc = document.getElementById("add_description").value.trim();
    let cat = document.getElementById("add_category").value;

    if (!name || !desc || !cat) {
      alert("Please fill in all fields.");
      return;
    }

    // Convert to title case
    name = toTitleCase(name);
    cat = toTitleCase(cat);

    fetch("manageProducts.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name: name, description: desc, category: cat })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        const newCard = document.createElement("div");
        newCard.className = "scard green";
        newCard.innerHTML = `
          <div class="card-icon">${getIcon(cat)}</div>
          <h3>${name}</h3>
          <p>${cat}</p>
        `;
        productsContainer.insertBefore(newCard, addCard);
        attachCardActions(newCard, { product_name: name, description: desc, category: cat, product_id: data.insert_id });
        addModal.classList.add("hidden");
        document.getElementById("add_product_name").value = "";
        document.getElementById("add_description").value = "";
        document.getElementById("add_category").value = "";
      } else {
        alert("Error adding product: " + data.message);
      }
    })
    .catch(err => console.error(err));
  });
});
