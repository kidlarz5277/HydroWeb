<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);
$items = $data['items'] ?? [];
$override_address = trim($data['address'] ?? '');
$override_fullname = trim($data['full_name'] ?? '');
$override_phone = trim($data['contact'] ?? '');

// Read shop_name from POST OR GET
$shop_name = $data['shop_name'] ?? ($_GET['shop_name'] ?? '');
if (!$shop_name) {
    echo json_encode(["error" => "Shop name not provided"]);
    exit;
}

// Get customer info
$username = $_SESSION['username'];
$stmtCustomer = $conn->prepare("SELECT customer_id, full_name, contact_no, home_address FROM customers WHERE user_name = ?");
$stmtCustomer->bind_param("s", $username);
$stmtCustomer->execute();
$customer = $stmtCustomer->get_result()->fetch_assoc();
if (!$customer) {
    echo json_encode(["error" => "Customer not found"]);
    exit;
}
$customer_id = $customer['customer_id'];

// Get user_id (shop owner) based on shop_name
$stmtUser = $conn->prepare("SELECT user_id FROM users WHERE shop_name = ?");
$stmtUser->bind_param("s", $shop_name);
$stmtUser->execute();
$user = $stmtUser->get_result()->fetch_assoc();
$user_id = $user['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(["error" => "Shop user record not found"]);
    exit;
}

// Use override if provided, else leave NULL
$full_name = $override_fullname ?: null;
$address = $override_address ?: null;
$phone_number = $override_phone ?: null;

// ==========================================
// Step 1: Find matching delivery pricing 
// Partial match, but "Jasaan" is fallback
// ==========================================

$home_address = strtolower($address ?: $customer['home_address']);

$stmtAreas = $conn->prepare("
    SELECT deliveryprice_id, area_name, delivery_fee 
    FROM delivery_pricing 
    WHERE user_id = ?
");
$stmtAreas->bind_param("i", $user_id);
$stmtAreas->execute();
$areas_result = $stmtAreas->get_result();

$home_words = preg_split("/[\s,]+/", $home_address);
$deliveryprice_id = null;
$delivery_fee = 0;
$jasaan_fallback = null;

// Scan all areas
while ($row = $areas_result->fetch_assoc()) {

    $area_name = strtolower($row['area_name']);

    // Save Jasaan for fallback
    if ($area_name === "jasaan") {
        $jasaan_fallback = $row;
    }

    // Try matching other areas
    foreach ($home_words as $word) {
        $word = strtolower(trim($word));
        if ($word && strpos($area_name, $word) !== false) {

            // Skip Jasaan here — fallback only
            if ($area_name === "jasaan") {
                continue;
            }

            // FOUND normal match
            $deliveryprice_id = $row['deliveryprice_id'];
            $delivery_fee = floatval($row['delivery_fee']);
            break 2;
        }
    }
}

// If nothing matched, but Jasaan exists → USE IT
if (!$deliveryprice_id && $jasaan_fallback) {
    $deliveryprice_id = $jasaan_fallback["deliveryprice_id"];
    $delivery_fee = floatval($jasaan_fallback["delivery_fee"]);
}

if (!$deliveryprice_id) {
    echo json_encode(["error" => "No delivery available for your area"]);
    exit;
}

// ==========================================
// Step 2: Calculate totals (delivery_fee × quantity per item)
// ==========================================

$total_amount = 0;

foreach ($items as $item) {
    $item_total = floatval($item['total']);
    $quantity = intval($item['quantity']);

    // DELIVERY FEE APPLIES PER ITEM * QUANTITY
    $delivery_total = $delivery_fee * $quantity;

    $total_amount += ($item_total + $delivery_total);
}

// Step 3: Insert into delivery_sales
$stmtSale = $conn->prepare("
    INSERT INTO delivery_sales 
        (user_id, customer_id, full_name, address, phone_number, deliveryprice_id, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'To Confirm')
");
$stmtSale->bind_param("iisssid", $user_id, $customer_id, $full_name, $address, $phone_number, $deliveryprice_id, $total_amount);
$stmtSale->execute();
$delivery_id = $stmtSale->insert_id;

// Step 4: Insert items into delivery_item
$stmtItem = $conn->prepare("
    INSERT INTO delivery_item (delivery_id, pricing_id, quantity, status)
    VALUES (?, ?, ?, 'To Confirm')
");

foreach ($items as $item) {
    $pricing_id = $item['pricing_id'] ?? null;
    $quantity = intval($item['quantity']);
    if ($pricing_id && $quantity > 0) {
        $stmtItem->bind_param("iii", $delivery_id, $pricing_id, $quantity);
        $stmtItem->execute();
    }
}

$stmtCustomer->close();
$stmtUser->close();
$stmtSale->close();
$stmtItem->close();
$stmtAreas->close();
$conn->close();

echo json_encode(["success" => true, "delivery_id" => $delivery_id]);
?>
