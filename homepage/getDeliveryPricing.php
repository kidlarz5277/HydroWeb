<?php
session_start();
header('Content-Type: application/json');

// ✅ Verify session
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'Not logged in']);
  exit;
}

// ✅ Connect to the database
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
  echo json_encode(['error' => 'Database connection failed']);
  exit;
}

$user_id = $_SESSION['user_id'];

// ✅ Fetch delivery pricing data
$sql = "SELECT deliveryprice_id, area_name, delivery_fee 
        FROM delivery_pricing 
        WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

// ✅ Output JSON response
echo json_encode([
  'success' => true,
  'deliveryPricing' => $data
]);

$stmt->close();
$conn->close();
?>
