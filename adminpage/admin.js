document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("feedbackContainer");

  // Fetch all feedback
  fetch("../adminpage/getFeedback.php")
    .then(response => response.json())
    .then(data => {
      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML = "<p class='no-feedback'>No feedback available.</p>";
        return;
      }

      data.forEach(item => {
        const card = document.createElement("div");
        card.className = "feedback-item";
        card.innerHTML = `
          <div class="feedback-header">
            <button class="user-btn">${item.shop_name}</button>
            <span class="date">${item.date_submitted}</span>
          </div>
          <p class="message">${item.message}</p>
          <button class="delete-btn" data-id="${item.feedback_id}">Delete</button>
        `;

        container.appendChild(card);
      });

      // Add delete button functionality
      document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", () => {
          const id = button.dataset.id;

          if (confirm("Are you sure you want to delete this feedback?")) {
            fetch("../adminpage/deleteFeedback.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: "feedback_id=" + id
            })
              .then(res => res.text())
              .then(response => {
                if (response === "success") {
                  button.closest(".feedback-item").remove();
                } else {
                  alert("Failed to delete feedback.");
                }
              });
          }
        });
      });
    })
    .catch(err => {
      container.innerHTML = `<p class="error">Error loading feedback: ${err}</p>`;
    });
});
