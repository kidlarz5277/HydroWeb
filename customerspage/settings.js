const toggleBtn = document.getElementById("togglePasswordBtn");
const passwordFields = document.getElementById("passwordFields");
toggleBtn.addEventListener("click", () => {
  passwordFields.classList.toggle("active");
  toggleBtn.textContent = passwordFields.classList.contains("active") ? "Hide Password Fields" : "Change Password";
});

const deleteBtn = document.getElementById("deleteAccountBtn");
const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

deleteBtn.addEventListener("click", () => deleteModal.style.display = "flex");
cancelDelete.addEventListener("click", () => deleteModal.style.display = "none");
confirmDelete.addEventListener("click", () => {
  deleteModal.style.display = "none";
  alert("Account deleted (simulation).");
});

document.getElementById("savePasswordBtn").addEventListener("click", () => {
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmPassword").value;
  if (newPass !== confirmPass) {
    alert("Passwords do not match!");
  } else {
    alert("Password changed successfully! (simulation)");
  }
});