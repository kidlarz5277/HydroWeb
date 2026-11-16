<?php
session_start();
header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['error' => 'User not logged in']);
  exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
  echo json_encode(['error' => 'Database connection failed.']);
  exit;
}

$category = $_GET['category'] ?? '';

if (empty($category)) {
  echo json_encode(['error' => 'Category is required.']);
  exit;
}

$stmt = $conn->prepare("SELECT product_id, product_name, description, category FROM product WHERE category = ?");
$stmt->bind_param("s", $category);
$stmt->execute();
$result = $stmt->get_result();
$products = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'products' => $products]);

$stmt->close();
$conn->close();
?>
