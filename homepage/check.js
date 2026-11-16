// ============================
// 🚰 Check Water Meter Before Sale
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const walkInCard = document.querySelector(".scard.blue");
  const deliveryCard = document.querySelector(".scard.yellow");

  // If the cards don't exist, exit early
  if (!walkInCard && !deliveryCard) return;

  // Function to check if user has a water meter
  async function hasWaterMeter() {
    try {
      const response = await fetch("../homepage/inventory.php?action=check_water_meter");
      const data = await response.json();
      return data.success && data.has_meter;
    } catch (err) {
      console.error("Error checking water meter:", err);
      return false;
    }
  }

  // Function to handle card clicks
  async function handleCardClick(targetUrl) {
    const meterExists = await hasWaterMeter();
    if (!meterExists) {
      alert("⚠️ You must add a water meter first!");
      window.location.href = "../homepage/inventory.html";
    } else {
      window.location.href = targetUrl;
    }
  }

  // Attach event listeners if the cards exist
  if (walkInCard) {
    walkInCard.addEventListener("click", () => handleCardClick("../homepage/makesale.html"));
  }
  if (deliveryCard) {
    deliveryCard.addEventListener("click", () => handleCardClick("../homepage/makedelivery.html"));
  }
});
