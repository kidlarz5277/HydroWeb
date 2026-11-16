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

// 1️⃣ Get customer home_address
$stmt = $conn->prepare("SELECT customer_id, home_address, full_name FROM customers WHERE user_name = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$customer = $result->fetch_assoc();

if (!$customer) {
    echo json_encode(['status' => 'no_address']);
    exit;
}

// 2️⃣ Determine which address to check: custom or home
$home_address = $_GET['address'] ?? $customer['home_address'];

// 3️⃣ Get delivery areas for the shop
if (!isset($_GET['shop_name'])) {
    echo json_encode(['error' => 'Missing shop_name']);
    exit;
}

$shop_name = $_GET['shop_name'];

$stmt2 = $conn->prepare("
    SELECT dp.area_name 
    FROM delivery_pricing dp
    JOIN users u ON u.user_id = dp.user_id
    WHERE u.shop_name = ?
");
$stmt2->bind_param("s", $shop_name);
$stmt2->execute();
$areas = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

// 4️⃣ Check for partial word match
$home_words = preg_split("/[\s,]+/", $home_address);
$matched = false;

foreach ($areas as $area) {
    $area_name = strtolower($area['area_name']);
    foreach ($home_words as $word) {
        $word = strtolower(trim($word));
        if ($word && strpos($area_name, $word) !== false) {
            $matched = true;
            break 2;
        }
    }
}

// 5️⃣ Return result
echo json_encode([
    'status' => $matched ? 'ok' : 'no_delivery',
    'customer_name' => $customer['full_name'] ?? ''
]);
