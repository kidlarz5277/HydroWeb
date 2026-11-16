document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".sdashboard-cards");
  const addCard = document.getElementById("watermeter");

  if (!container || !addCard) {
    console.error("Required elements not found in the DOM");
    return;
  }

  // ---------- HELPER FUNCTION ----------
  // Capitalizes first letters of words, single letters uppercase,
  // also capitalizes letters in number+letter words (like 1l -> 1L)
  const toTitleWithSingleCaps = (str) => {
    return str.split(" ").map(word => {
      if (word.length === 1) return word.toUpperCase(); // single letter

      // Check if word contains number(s) followed by letters
      const match = word.match(/^(\d*)([a-zA-Z]+)$/);
      if (match) {
        const numberPart = match[1];
        const letterPart = match[2].toUpperCase();
        return numberPart + letterPart;
      }

      // Otherwise, normal title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
  };

  // ⭐ Function to attach Edit/Delete actions
  const attachCardActions = (card, size) => {
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
      openEditModal(size, card);
    });

    // Delete
    actions.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (!size.watersize_id) return alert("Missing water ID");
      if (confirm("Delete this water size?")) {
        fetch("manageWaterSize.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watersize_id: size.watersize_id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") card.remove();
          else alert("Error: " + data.message);
        })
        .catch(err => console.error(err));
      }
    });
  };

  // Load water sizes
  fetch("manageWaterSize.php")
    .then(res => res.json())
    .then(sizes => {
      sizes.forEach(s => {
        const card = document.createElement("div");
        card.className = "scard darkgreen";
        const decimalVolume = parseFloat(s.volume_liters).toFixed(2);
        const label = toTitleWithSingleCaps(s.size_label);
        card.innerHTML = `
          <div class="card-icon">🧪</div>
          <h3>${label}</h3>
          <p>${decimalVolume} L</p>
        `;
        container.insertBefore(card, addCard);
        attachCardActions(card, { ...s, size_label: label, volume_liters: decimalVolume });
      });
    })
    .catch(err => console.error("Error fetching water sizes:", err));

  // Add Modal
  const addModal = document.createElement("div");
  addModal.className = "modal hidden";
  addModal.innerHTML = `
    <div class="modal-content">
      <h2>Add Water Size</h2>
      <label>Size Label</label>
      <input type="text" id="size_label" placeholder="Enter size label" />
      <label>Volume (Liters)</label>
      <input type="number" id="volume_liters" placeholder="Enter volume" step="0.01" />
      <div class="modal-buttons">
        <button id="saveWaterSize">Save</button>
        <button id="cancelWaterSize">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(addModal);

  addCard.addEventListener("click", () => addModal.classList.remove("hidden"));
  document.getElementById("cancelWaterSize").addEventListener("click", () => addModal.classList.add("hidden"));

  // Save new water size
  document.getElementById("saveWaterSize").addEventListener("click", () => {
    let label = document.getElementById("size_label").value.trim();
    const volume = document.getElementById("volume_liters").value.trim();

    if (!label || !volume) return alert("Both size label and volume are required.");

    label = toTitleWithSingleCaps(label);

    fetch("manageWaterSize.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size_label: label, volume_liters: volume })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        const decimalVolume = parseFloat(volume).toFixed(2);
        const newCard = document.createElement("div");
        newCard.className = "scard darkgreen";
        newCard.innerHTML = `
          <div class="card-icon">🧪</div>
          <h3>${label}</h3>
          <p>${decimalVolume} L</p>
        `;
        container.insertBefore(newCard, addCard);
        attachCardActions(newCard, { size_label: label, volume_liters: decimalVolume, watersize_id: data.insert_id });

        addModal.classList.add("hidden");
        document.getElementById("size_label").value = "";
        document.getElementById("volume_liters").value = "";
      } else {
        alert("Error adding water size: " + data.message);
      }
    })
    .catch(err => console.error("Error adding water size:", err));
  });

  // ⭐ Edit Modal
  const editModal = document.createElement("div");
  editModal.className = "modal hidden";
  editModal.innerHTML = `
    <div class="modal-content">
      <h2>Edit Water Size</h2>
      <label>Size Label</label>
      <input type="text" id="edit_size_label" />
      <label>Volume (Liters)</label>
      <input type="number" id="edit_volume_liters" step="0.01" />
      <div class="modal-buttons">
        <button id="updateWaterSize">Update</button>
        <button id="cancelEditWaterSize">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);

  document.getElementById("cancelEditWaterSize").addEventListener("click", () => editModal.classList.add("hidden"));

  const openEditModal = (size, card) => {
    document.getElementById("edit_size_label").value = size.size_label;
    document.getElementById("edit_volume_liters").value = size.volume_liters;
    editModal.classList.remove("hidden");

    const updateButton = document.getElementById("updateWaterSize");
    updateButton.onclick = () => {
      let newLabel = document.getElementById("edit_size_label").value.trim();
      const newVolume = document.getElementById("edit_volume_liters").value.trim();

      if (!newLabel || !newVolume) return alert("Both fields are required.");

      newLabel = toTitleWithSingleCaps(newLabel);

      fetch("manageWaterSize.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watersize_id: size.watersize_id, size_label: newLabel, volume_liters: newVolume })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          card.querySelector("h3").textContent = newLabel;
          card.querySelector("p").textContent = parseFloat(newVolume).toFixed(2) + " L";
          editModal.classList.add("hidden");

          alert("Water size updated successfully!");
        } else {
          alert("Error updating water size: " + data.message);
        }
      })
      .catch(err => console.error(err));
    };
  };
});
