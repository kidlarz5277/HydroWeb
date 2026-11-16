document.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.getElementById("userIcon");
  const dropdown = document.getElementById("userDropdown");

  if (userIcon && dropdown) {
    // Toggle dropdown when user icon is clicked
    userIcon.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  // ===================== Notification Bell Dropdown =====================
  const bell = document.getElementById("notifBell");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const notifCount = document.getElementById("notifCount");

  if (bell && notifDropdown && notifList) {
    // Make dropdown scrollable
    notifDropdown.style.maxHeight = "300px"; // adjust height as needed
    notifDropdown.style.overflowY = "auto";

    // Toggle notification dropdown
    bell.addEventListener("click", () => {
      notifDropdown.style.display = notifDropdown.style.display === "flex" ? "none" : "flex";
    });

    // Close notification dropdown if clicked outside
    document.addEventListener("click", (e) => {
      if (!bell.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = "none";
      }
    });

    // Function to load notifications from PHP
    async function loadNotifications() {
      try {
        const res = await fetch("fetchNotifications.php");
        const data = await res.json();

        if (data.error) return;

        notifList.innerHTML = "";
        let unreadCount = 0;

        if (!data.notifications || data.notifications.length === 0) {
          notifList.innerHTML = "<p style='padding:10px;'>No unread notifications.</p>";
          notifCount.style.display = "none";
          return;
        }

        data.notifications.forEach(notif => {
          unreadCount++;

          const div = document.createElement("div");
          div.className = "notification-item unread";
          div.innerHTML = `
            <div class="notif-message">${notif.message}</div>
            <div class="notif-time">${new Date(notif.created_at).toLocaleString()}</div>
          `;

          // CLICK EVENT for redirect + mark as read
          div.addEventListener("click", async () => {

            // Mark notification as read
            await fetch("markNotifRead.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: "id=" + notif.id
            });

            const msg = notif.message.toLowerCase();

            // Redirects
            if (msg.includes("confirmed")) {
              window.location.href = "RequestDelivery.html";
              return;
            } 
            else if (msg.includes("delivered")) {
              window.location.href = "DeliveredHistory.html";
              return;
            }

            // If cancelled → remove notif only
            if (msg.includes("canceled")) {
              div.remove(); // remove item

              let left = notifList.children.length;
              notifCount.textContent = left;

              if (left === 0) {
                notifList.innerHTML = "<p style='padding:10px;'>No unread notifications.</p>";
                notifCount.style.display = "none";
              }

              return;
            }

            // Reload after clicking (fallback)
            loadNotifications();
          });

          notifList.appendChild(div);
        });

        notifCount.textContent = unreadCount;
        notifCount.style.display = unreadCount > 0 ? "inline-block" : "none";

      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }

    // Initial load
    loadNotifications();

    // Refresh notifications every 2 seconds
    setInterval(loadNotifications, 2000);
  }
});
