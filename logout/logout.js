function logoutUser() {
  fetch('../logout/logout.php')
    .then(() => {
      // Prevent the user from navigating back to a logged-in page
      window.history.pushState(null, null, '../loginpage/index.html');
      window.location.href = '../loginpage/index.html';
    })
    .catch(err => {
      console.error('Logout failed:', err);
      window.location.href = '../loginpage/index.html';
    });
}

// Prevent browser back after logout
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    // If user tries to go back, redirect to login
    window.location.href = '../loginpage/index.html';
  }
});
