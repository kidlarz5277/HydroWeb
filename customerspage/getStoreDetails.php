<?php
header('Content-Type: application/json');

// Database connection
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "hydroweb_db";

$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Get shop_name from URL
$shop_name = isset($_GET['shop_name']) ? $_GET['shop_name'] : '';

if (empty($shop_name)) {
    echo json_encode(["error" => "No shop name provided"]);
    exit;
}

// Prepare statement to prevent SQL injection
$stmt = $conn->prepare("SELECT full_name, shop_name, contact_no, opening_time, closing_time, business_address FROM users WHERE shop_name = ? LIMIT 1");
$stmt->bind_param("s", $shop_name);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // Return store details as JSON
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Store not found"]);
}

// Close connections
$stmt->close();
$conn->close();
?>
