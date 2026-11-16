<?php
session_start();
header('Content-Type: application/json');

// ===============================
// 🔐 Verify User Session
// ===============================
if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

// ===============================
// 💾 Database Connection
// ===============================
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$username = $_SESSION['username'];

// ===============================
// 👤 Get Logged-in User ID
// ===============================
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

// ===============================
// 📦 Parse Incoming JSON Data
// ===============================
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data) || empty($data)) {
    echo json_encode(['error' => 'No delivery data received']);
    exit;
}

// ===============================
// 🚚 Insert or Update Each Entry
// ===============================
$inserted = 0;
$updated = 0;

foreach ($data as $item) {
    $area_name = trim($item['area_name'] ?? '');
    $delivery_fee = floatval($item['delivery_fee'] ?? 0);

    if ($area_name === '' || $delivery_fee < 0) continue;

    // ✅ Check if area already exists for this user
    $check = $conn->prepare("SELECT deliveryprice_id FROM delivery_pricing WHERE user_id = ? AND area_name = ?");
    $check->bind_param("is", $user_id, $area_name);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows > 0) {
        // ✅ Update existing record
        $update = $conn->prepare("
            UPDATE delivery_pricing 
            SET delivery_fee = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND area_name = ?
        ");
        $update->bind_param("dis", $delivery_fee, $user_id, $area_name);
        if ($update->execute()) $updated++;
        $update->close();
    } else {
        // ✅ Insert new record
        $insert = $conn->prepare("
            INSERT INTO delivery_pricing (user_id, area_name, delivery_fee, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $insert->bind_param("isd", $user_id, $area_name, $delivery_fee);
        if ($insert->execute()) $inserted++;
        $insert->close();
    }

    $check->close();
}

$conn->close();

// ===============================
// ✅ Response
// ===============================
echo json_encode([
    'success' => true,
    'message' => "Delivery pricing saved successfully — $inserted added, $updated updated."
]);
?>
