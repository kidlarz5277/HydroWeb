<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'items' => [],
        'error' => 'User not logged in.'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];
$delivery_id = isset($_GET['delivery_id']) ? (int)$_GET['delivery_id'] : 0;

if ($delivery_id <= 0) {
    echo json_encode([
        'success' => false,
        'items' => [],
        'error' => 'Invalid delivery ID.'
    ]);
    exit;
}

// Database connection
$mysqli = new mysqli("localhost", "root", "", "hydroweb_db");
if ($mysqli->connect_errno) {
    echo json_encode([
        'success' => false,
        'items' => [],
        'error' => "DB connection failed: " . $mysqli->connect_error
    ]);
    exit;
}

// ✅ Check if the delivery belongs to this user
$stmt = $mysqli->prepare("SELECT COUNT(*) FROM delivery_sales WHERE delivery_id = ? AND user_id = ?");
$stmt->bind_param("ii", $delivery_id, $user_id);
$stmt->execute();
$stmt->bind_result($count);
$stmt->fetch();
$stmt->close();

if ($count === 0) {
    echo json_encode([
        'success' => false,
        'items' => [],
        'error' => 'Delivery not found or access denied.'
    ]);
    $mysqli->close();
    exit;
}

// Fetch delivery items
$stmt = $mysqli->prepare("
    SELECT delivery_item_id, pricing_id, quantity, status
    FROM delivery_item
    WHERE delivery_id = ?
");
$stmt->bind_param("i", $delivery_id);
$stmt->execute();
$result = $stmt->get_result();
$items = $result->fetch_all(MYSQLI_ASSOC);

$stmt->close();
$mysqli->close();

echo json_encode([
    'success' => true,
    'items' => $items
]);
?>
