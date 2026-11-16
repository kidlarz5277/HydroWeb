<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

// Get full user details from your table
$userQuery = $conn->prepare("
    SELECT user_id, full_name, contact_no, shop_name, business_address 
    FROM users 
    WHERE user_name = ?
");
$userQuery->bind_param("s", $username);
$userQuery->execute();
$userResult = $userQuery->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $userResult->fetch_assoc();
$user_id = $user['user_id'];

// Return JSON with correct keys matching your table
echo json_encode([
    'full_name' => $user['full_name'],
    'contact_no' => $user['contact_no'],
    'store_name' => $user['shop_name'],
    'address' => $user['business_address']
]);

$conn->close();
?>
