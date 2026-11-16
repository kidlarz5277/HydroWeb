<?php
session_start();
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

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

// --- Get user_id and shop name ---
$userQuery = $conn->prepare("SELECT user_id, shop_name FROM users WHERE user_name = ?");
$userQuery->bind_param("s", $username);
$userQuery->execute();
$userResult = $userQuery->get_result();

if ($userResult->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $userResult->fetch_assoc();
$user_id = $user['user_id'];
$shop_name = $user['shop_name'];

// --- Get today's total sales (sales + deliveries delivered today) using CURDATE() ---
$todayQuery = $conn->prepare("
    SELECT COALESCE(SUM(total_amount), 0) AS today_total
    FROM (
        SELECT total_amount FROM sales WHERE user_id = ? AND sale_date = CURDATE()
        UNION ALL
        SELECT total_amount FROM delivery_sales WHERE user_id = ? AND status = 'Delivered' AND DATE(delivered_at) = CURDATE()
    ) AS combined
");
$todayQuery->bind_param("ii", $user_id, $user_id);
$todayQuery->execute();
$todayResult = $todayQuery->get_result();
$today_sales = $todayResult->fetch_assoc()['today_total'] ?? 0;

// --- Get overall (gross) sales including delivered deliveries ---
$grossQuery = $conn->prepare("
    SELECT COALESCE(SUM(total_amount), 0) AS gross_total 
    FROM (
        SELECT total_amount FROM sales WHERE user_id = ?
        UNION ALL
        SELECT total_amount FROM delivery_sales WHERE user_id = ? AND status = 'Delivered'
    ) AS combined_sales
");
$grossQuery->bind_param("ii", $user_id, $user_id);
$grossQuery->execute();
$grossResult = $grossQuery->get_result();
$gross_sales = $grossResult->fetch_assoc()['gross_total'] ?? 0;

// --- Get 20L Container quantity ---
$containerQuery = $conn->prepare("
    SELECT quantity 
    FROM inventory 
    WHERE product_id = 5 AND user_id = ? 
    LIMIT 1
");
$containerQuery->bind_param("i", $user_id);
$containerQuery->execute();
$containerResult = $containerQuery->get_result();
$containerData = $containerResult->fetch_assoc();
$container_count = $containerData ? (int)$containerData['quantity'] : 0;

// --- Pending deliveries (optional) ---
$pendingDeliveries = 0; // Replace with real query if needed

// --- Return JSON response ---
echo json_encode([
    'shop_name' => $shop_name,
    'today_sales' => $today_sales,
    'gross_sales' => $gross_sales,
    'container_count' => $container_count,
    'pending_deliveries' => $pendingDeliveries
]);

$conn->close();
?>
