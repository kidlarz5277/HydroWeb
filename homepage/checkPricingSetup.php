<?php
session_start();
header('Content-Type: application/json');

// 🔐 Require login
if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

// 👤 Get user_id
$userQuery = $conn->prepare("SELECT user_id FROM users WHERE user_name = ?");
$userQuery->bind_param("s", $username);
$userQuery->execute();
$userResult = $userQuery->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $userResult->fetch_assoc();
$user_id = $user['user_id'];

// ✅ Check if this user has any entries in product_pricing
$check = $conn->prepare("SELECT COUNT(*) AS count FROM product_pricing WHERE user_id = ?");
$check->bind_param("i", $user_id);
$check->execute();
$result = $check->get_result()->fetch_assoc();

echo json_encode(['hasPricing' => $result['count'] > 0]);
$conn->close();
?>
