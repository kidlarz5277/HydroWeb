const createBtn = document.getElementById("createAccountBtn");
const loginForm = document.getElementById("loginForm");
const accountType = document.getElementById("accountTypeContainer");
const backBtn = document.getElementById("backBtn");

// When "Create Account" is clicked
createBtn.addEventListener("click", () => {
  loginForm.style.display = "none";
  accountType.style.display = "block";
});

// Go back to login form
backBtn.addEventListener("click", () => {
  accountType.style.display = "none";
  loginForm.style.display = "block";
});

// When "Customer" button is clicked
document.querySelector(".customer-btn").addEventListener("click", () => {
  window.location.href = "../loginpage/customerRegister.html";
});

// When "Business Owner" button is clicked -> redirect
document.querySelector(".business-btn").addEventListener("click", () => {
  window.location.href = "../loginpage/adminRegister.html"; // 👈 Change to your file path
});
