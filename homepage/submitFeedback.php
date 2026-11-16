<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$feedbackMessage = trim($data['message'] ?? '');

if (empty($feedbackMessage)) {
    echo json_encode(['error' => 'Feedback message cannot be empty']);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

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

$insertQuery = $conn->prepare("INSERT INTO feedback (message, user_id) VALUES (?, ?)");
$insertQuery->bind_param("si", $feedbackMessage, $user_id);

if ($insertQuery->execute()) {
    echo json_encode(['success' => 'Feedback submitted successfully']);
} else {
    echo json_encode(['error' => 'Failed to submit feedback']);
}

$conn->close();
?>
