document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".sdashboard-cards");
  const addCard = document.getElementById("watermeter");

  if (!container || !addCard) {
    console.error("Required elements not found in the DOM");
    return;
  }

  // ---------- HELPER FUNCTIONS ----------
  const getIcon = () => "💧";

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const attachCardActions = (card, type) => {
    const actions = document.createElement("div");
    actions.className = "card-actions hidden";
    actions.innerHTML = `
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;
    card.appendChild(actions);

    card.addEventListener("click", () => actions.classList.toggle("hidden"));

    // Edit
    actions.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();

      // Fetch the latest data for this water type
      fetch(`manageWaterTypes.php?water_id=${type.water_id}`)
        .then(res => res.json())
        .then(latestData => {
          if (!latestData.water_name) throw new Error("Water type not found");

          // Populate modal with latest data in title case
          document.getElementById("edit_water_name").value = toTitleCase(latestData.water_name);
          document.getElementById("edit_description").value = latestData.description || "";
          editModal.classList.remove("hidden");

          const saveBtn = document.getElementById("edit_saveWaterType");

          const saveHandler = () => {
            let name = document.getElementById("edit_water_name").value.trim();
            const desc = document.getElementById("edit_description").value.trim();

            if (!name) { alert("Water name required"); return; }

            // Convert to title case
            name = toTitleCase(name);

            fetch("manageWaterTypes.php", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ water_id: type.water_id, water_name: name, description: desc })
            })
            .then(res => res.json())
            .then(data => {
              if (data.status === "success") {
                // Update card text immediately
                card.querySelector("h3").textContent = name;
                editModal.classList.add("hidden");
                alert("Water type updated successfully!");
                saveBtn.removeEventListener("click", saveHandler);
              } else {
                alert("Error updating: " + data.message);
              }
            })
            .catch(err => console.error(err));
          };

          // Remove previous listeners to prevent duplicates
          saveBtn.replaceWith(saveBtn.cloneNode(true));
          document.getElementById("edit_saveWaterType").addEventListener("click", saveHandler);
        })
        .catch(err => {
          console.error(err);
          alert("Failed to fetch latest data: " + err.message);
        });
    });

    // Delete
    actions.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Delete this water type?")) {
        fetch("manageWaterTypes.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ water_id: type.water_id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            card.remove();
          } else {
            alert("Error: " + data.message);
          }
        });
      }
    });
  };

  // ---------- CREATE MODALS ----------

  // Add Modal
  const addModal = document.createElement("div");
  addModal.className = "modal hidden";
  addModal.innerHTML = `
    <div class="modal-content">
      <h2>Add Water Type</h2>
      <label>Water Name</label>
      <input type="text" id="add_water_name" placeholder="Enter water name" />
      <label>Description</label>
      <textarea id="add_description" placeholder="Enter description"></textarea>
      <div class="modal-buttons">
        <button id="add_saveWaterType">Save</button>
        <button id="add_cancelWaterType">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(addModal);

  // Edit Modal
  const editModal = document.createElement("div");
  editModal.className = "modal hidden";
  editModal.innerHTML = `
    <div class="modal-content">
      <h2>Edit Water Type</h2>
      <label>Water Name</label>
      <input type="text" id="edit_water_name" />
      <label>Description</label>
      <textarea id="edit_description"></textarea>
      <div class="modal-buttons">
        <button id="edit_saveWaterType">Save</button>
        <button id="edit_cancelWaterType">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);

  // Show/Hide modals
  addCard.addEventListener("click", () => addModal.classList.remove("hidden"));
  document.getElementById("add_cancelWaterType").addEventListener("click", () => addModal.classList.add("hidden"));
  document.getElementById("edit_cancelWaterType").addEventListener("click", () => editModal.classList.add("hidden"));

  // ---------- LOAD WATER TYPES ----------
  fetch("manageWaterTypes.php")
    .then(res => res.json())
    .then(types => {
      types.forEach(t => {
        const card = document.createElement("div");
        card.className = "scard darkblue";
        card.innerHTML = `<div class="card-icon">${getIcon()}</div><h3>${toTitleCase(t.water_name)}</h3>`;
        container.insertBefore(card, addCard);
        attachCardActions(card, t);
      });
    })
    .catch(err => console.error(err));

  // ---------- ADD WATER TYPE ----------
  document.getElementById("add_saveWaterType").addEventListener("click", () => {
    let name = document.getElementById("add_water_name").value.trim();
    const desc = document.getElementById("add_description").value.trim();
    if (!name) { alert("Water name required"); return; }

    // Convert to title case
    name = toTitleCase(name);

    fetch("manageWaterTypes.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ water_name: name, description: desc })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        const newCard = document.createElement("div");
        newCard.className = "scard darkblue";
        newCard.innerHTML = `<div class="card-icon">${getIcon()}</div><h3>${name}</h3>`;
        container.insertBefore(newCard, addCard);
        attachCardActions(newCard, { water_name: name, description: desc, water_id: data.insert_id });
        addModal.classList.add("hidden");
        document.getElementById("add_water_name").value = "";
        document.getElementById("add_description").value = "";
      } else {
        alert("Error adding water type: " + data.message);
      }
    })
    .catch(err => console.error(err));
  });
});
