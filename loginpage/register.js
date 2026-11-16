const contactInput = document.getElementById('contactno');

// Live validation while typing
contactInput.addEventListener('input', function () {
  // Allow only digits
  this.value = this.value.replace(/[^0-9]/g, '');

  // Limit to 11 digits
  if (this.value.length > 11) {
    this.value = this.value.slice(0, 11);
  }

  // Border color updates
  if (this.value.startsWith("09") && this.value.length === 11) {
    this.style.border = "";  // revert to original border
  } else {
    this.style.border = "2px solid red";  // invalid
  }
});

// Validation on form submit
document.querySelector(".register-form").addEventListener("submit", function(e) {
  const contact = contactInput.value;

  if (!contact.startsWith("09") || contact.length !== 11) {
    e.preventDefault();
    contactInput.style.border = "2px solid red";
    alert("Contact number must start with 09 and be exactly 11 digits.");
  }
});
