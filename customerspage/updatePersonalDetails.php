<?php
session_start();

// Always return JSON
header("Content-Type: application/json");

// Check if user is logged in and account type is 'customers'
if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Validate input fields
$full_name    = trim($input['full_name'] ?? '');
$contact_no   = trim($input['contact_no'] ?? '');
$home_address = trim($input['home_address'] ?? '');

if ($full_name === '' || $contact_no === '' || $home_address === '') {
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

// Database connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

// Update customer details using prepared statement
$stmt = $conn->prepare("UPDATE customers SET full_name = ?, contact_no = ?, home_address = ? WHERE user_name = ?");
$stmt->bind_param("ssss", $full_name, $contact_no, $home_address, $username);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Failed to update details']);
}

$stmt->close();
$conn->close();
