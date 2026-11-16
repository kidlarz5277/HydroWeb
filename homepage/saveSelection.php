<?php
session_start();
header('Content-Type: application/json');

// =========================
// 🧭 Session Check
// =========================
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

// =========================
// 🧩 Database Connection
// =========================
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$user_id = $_SESSION['user_id'];

// =========================
// 📦 Parse JSON Payload
// =========================
$data = json_decode(file_get_contents("php://input"), true);
$products = $data['products'] ?? null;

if (!is_array($products) || empty($products)) {
    echo json_encode(['success' => false, 'error' => 'Invalid or empty product data']);
    exit;
}

// =========================
// 💾 Insert or Update Pricing
// =========================
foreach ($products as $item) {
    $product_id = intval($item['product_id'] ?? 0);
    $unit_cost  = floatval($item['unit_cost'] ?? 0);
    $unit_price = floatval($item['unit_price'] ?? 0);
    $status     = ($item['status'] ?? 'Available') === 'Available' ? 'Available' : 'Not Available';

    if ($product_id <= 0) continue;

    // 🔍 Check if a pricing record already exists for this user and product
    $check = $conn->prepare("SELECT pricing_id FROM product_pricing WHERE user_id=? AND product_id=?");
    $check->bind_param("ii", $user_id, $product_id);
    $check->execute();
    $checkResult = $check->get_result();

    if ($checkResult->num_rows > 0) {
        // 🧾 Update existing record (includes date_effective)
        $update = $conn->prepare("
            UPDATE product_pricing
            SET unit_cost=?, unit_price=?, status=?, date_effective=CURDATE()
            WHERE user_id=? AND product_id=?
        ");
        $update->bind_param("ddsii", $unit_cost, $unit_price, $status, $user_id, $product_id);
        $update->execute();
        $update->close();
    } else {
        // ➕ Insert new record with date_effective
        $insert = $conn->prepare("
            INSERT INTO product_pricing (unit_cost, unit_price, product_id, user_id, status, date_effective)
            VALUES (?, ?, ?, ?, ?, CURDATE())
        ");
        $insert->bind_param("ddiis", $unit_cost, $unit_price, $product_id, $user_id, $status);
        $insert->execute();
        $insert->close();
    }

    $check->close();
}

// =========================
// 📤 Return All Saved Products for this User
// =========================
$query = $conn->prepare("
    SELECT 
        pp.product_id, 
        p.product_name, 
        pp.unit_cost, 
        pp.unit_price, 
        pp.status,
        pp.date_effective
    FROM product_pricing pp
    INNER JOIN product p ON pp.product_id = p.product_id
    WHERE pp.user_id = ?
    ORDER BY p.product_name
");
$query->bind_param("i", $user_id);
$query->execute();
$result = $query->get_result();
$products = $result->fetch_all(MYSQLI_ASSOC);
$query->close();
$conn->close();

// ✅ Return Response
echo json_encode([
    'success' => true,
    'productPricing' => $products
]);
?>
