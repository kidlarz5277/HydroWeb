document.addEventListener("DOMContentLoaded", () => {
    fetch("../adminpage/dashboardCounts.php") 
        .then(response => response.json())
        .then(data => {
            document.getElementById("pendingAdmins").textContent = data.pendingAdmins;
            document.getElementById("containerCount").textContent = data.containerCount;
            document.getElementById("newFeedbacks").textContent = data.newFeedbacks;
            document.getElementById("waterTypes").textContent = data.waterTypes;
        })
        .catch(error => console.error("Error fetching dashboard counts:", error));
});
