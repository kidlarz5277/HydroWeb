<?php
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

$stmt = $conn->prepare("SELECT customer_id, full_name FROM customers WHERE user_name = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Customer not found']);
    exit;
}

$row = $result->fetch_assoc();

echo json_encode([
    'customer_id' => $row['customer_id'],
    'full_name'   => $row['full_name']
]);

$stmt->close();
$conn->close();
?>
