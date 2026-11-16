document.addEventListener("DOMContentLoaded", loadUsers);

/* ============================================================
   LOAD USERS
============================================================ */
function loadUsers() {
  fetch("userStatus.php")
    .then(res => res.json())
    .then(users => displayUsers(users))
    .catch(err => console.error("Fetch error:", err));
}

/* ============================================================
   DISPLAY USERS IN TABLE
============================================================ */
function displayUsers(users) {
  const body = document.getElementById("usersTableBody");
  body.innerHTML = "";

  users.forEach(user => {
    const row = document.createElement("tr");

    // Determine proper status class for styling
    const statusClass = user.status === "Activated" ? "status-active" : "status-inactive";

    row.innerHTML = `
      <td>${user.shop_name}</td>
      <td>${user.business_address}</td>
      <td>${user.email}</td> <!-- Added email column -->
      <td>
        <span class="status-text ${statusClass}" id="status-${user.user_id}">
          ${user.status}
        </span>
      </td>
      <td>
        <label class="switch">
          <input 
            type="checkbox" 
            ${user.status === "Activated" ? "checked" : ""}
            onchange="toggleStatus(${user.user_id}, this.checked)">
          <span class="slider"></span>
        </label>
      </td>
    `;

    body.appendChild(row);
  });
}

/* ============================================================
   TOGGLE SWITCH HANDLER
============================================================ */
function toggleStatus(userId, isActive) {
  const newStatus = isActive ? "Activated" : "Deactivated";

  fetch("userStatus.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      status: newStatus
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result.status === "success") {
        // Update status text and styling dynamically
        const statusSpan = document.getElementById(`status-${userId}`);
        statusSpan.textContent = newStatus;
        statusSpan.className = "status-text " + (isActive ? "status-active" : "status-inactive");
      } else {
        alert("Error updating: " + result.message);
      }
    })
    .catch(err => console.error("Update error:", err));
}
