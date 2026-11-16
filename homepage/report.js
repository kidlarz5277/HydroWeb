document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#salesReportTable tbody");

  fetch("../homepage/inventory.php?action=get_sales_report") // update path to your PHP file
    .then(response => response.json())
    .then(data => {
      tableBody.innerHTML = ""; // clear any existing rows

      if (data.success && data.data.length > 0) {
        // Populate table rows
        data.data.forEach((report, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>₱${parseFloat(report.total_sales).toFixed(2)}</td>
            <td>${parseFloat(report.variance_meter).toFixed(3)}</td>
            <td>${report.report_start}</td>
            <td>${report.report_end}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        // No data available
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; font-style: italic; color: #6b7280;">
              No sales report available.
            </td>
          </tr>
        `;
      }
    })
    .catch(err => {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; font-style: italic; color: #e74c3c;">
            Error loading sales report.
          </td>
        </tr>
      `;
      console.error(err);
    });
});
