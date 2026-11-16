<?php
session_start();
header("Content-Type: application/json");

// Check login
if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

// DB connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");

if ($conn->connect_error) {
    echo json_encode(['error' => 'Database error']);
    exit;
}

$username = $_SESSION['username'];

// Fetch customer_id
$stmt = $conn->prepare("SELECT customer_id FROM customers WHERE user_name = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(['error' => 'Customer not found']);
    exit;
}

$customer_id = $res->fetch_assoc()['customer_id'];

// Return only unread notifications
$notifStmt = $conn->prepare("
    SELECT notification_id, message, status, is_read, created_at
    FROM notifications
    WHERE customer_id = ? AND is_read = 0
    ORDER BY created_at DESC
");
$notifStmt->bind_param("i", $customer_id);
$notifStmt->execute();
$notifRes = $notifStmt->get_result();

$notifications = [];
while ($row = $notifRes->fetch_assoc()) {
    $notifications[] = [
        'id' => $row['notification_id'],
        'message' => $row['message'],
        'status' => $row['status'],
        'created_at' => $row['created_at']
    ];
}

echo json_encode(['notifications' => $notifications]);
?>
