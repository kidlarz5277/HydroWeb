<?php
session_start();
header("Content-Type: application/json");

if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");

if (!isset($_POST['id'])) {
    echo json_encode(['error' => 'Missing notification ID']);
    exit;
}

$notif_id = intval($_POST['id']);

$stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ?");
$stmt->bind_param("i", $notif_id);
$stmt->execute();

echo json_encode(['success' => true]);
?>
