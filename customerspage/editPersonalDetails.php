<?php
session_start();

// Always return JSON
header("Content-Type: application/json");

// Check if user is logged in and account type is 'customers'
if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

// Database connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

// Fetch customer details using username
$stmt = $conn->prepare("SELECT customer_id, full_name, contact_no, home_address FROM customers WHERE user_name = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Customer not found']);
    exit;
}

$row = $result->fetch_assoc();

// Return full customer info as JSON
echo json_encode([
    'customer_id' => $row['customer_id'],
    'full_name'   => $row['full_name'],
    'contact_no'  => $row['contact_no'],
    'home_address'=> $row['home_address']
]);

$stmt->close();
$conn->close();
