<?php
session_start();

// Always return JSON
header("Content-Type: application/json");

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

// Get logged-in customer info
$stmt = $conn->prepare("SELECT customer_id, full_name, contact_no, home_address FROM customers WHERE user_name = ?");
if (!$stmt) {
    echo json_encode(['error' => 'SQL prepare failed: ' . $conn->error]);
    exit;
}
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Customer not found']);
    exit;
}

$customer = $result->fetch_assoc();
$customer_id = $customer['customer_id'];

// Fetch deliveries for this customer with status Pending or To Confirm
$sql = "
    SELECT 
        d.delivery_id,
        d.status,
        d.address AS delivery_address,
        d.total_amount,          -- include total_amount from delivery_sales
        u.shop_name,
        u.business_address AS store_address,
        u.contact_no AS user_contact,  -- contact from users table
        c.home_address AS customer_home,
        dp.delivery_fee
    FROM delivery_sales d
    INNER JOIN users u ON d.user_id = u.user_id
    INNER JOIN customers c ON d.customer_id = c.customer_id
    LEFT JOIN delivery_pricing dp ON d.deliveryprice_id = dp.deliveryprice_id
    WHERE d.customer_id = ?
      AND d.status IN ('Pending', 'To Confirm')
    ORDER BY d.created_at DESC
";

$stmt2 = $conn->prepare($sql);
if (!$stmt2) {
    echo json_encode(['error' => 'SQL prepare failed: ' . $conn->error]);
    exit;
}
$stmt2->bind_param("i", $customer_id);
$stmt2->execute();
$result2 = $stmt2->get_result();

$deliveries = [];
while ($row = $result2->fetch_assoc()) {

    // Capitalize delivery address and fallback to customer's home address if empty
    $deliveryAddress = !empty($row['delivery_address']) ? $row['delivery_address'] : $row['customer_home'];
    $row['final_address'] = ucwords(strtolower($deliveryAddress));
    
    $row['contact_no'] = $row['user_contact']; // contact from users table

    // ===============================
    // Add delivery items
    // ===============================
    $itemQuery = $conn->prepare("
        SELECT 
            COALESCE(p.product_name, CONCAT(wt.water_name, ' ', ws.size_label)) AS product_name,
            pp.unit_price,
            di.quantity
        FROM delivery_item di
        INNER JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
        LEFT JOIN product p ON pp.product_id = p.product_id
        LEFT JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
        LEFT JOIN water_type wt ON wv.water_id = wt.water_id
        LEFT JOIN water_size ws ON wv.watersize_id = ws.watersize_id
        WHERE di.delivery_id = ?
    ");
    $itemQuery->bind_param("i", $row['delivery_id']);
    $itemQuery->execute();
    $itemResult = $itemQuery->get_result();

    $items = [];
    $totalQuantity = 0;
    while ($itemRow = $itemResult->fetch_assoc()) {
        $quantity = intval($itemRow['quantity']);
        $totalQuantity += $quantity;

        // Map to JS-friendly keys
        $items[] = [
            'product' => $itemRow['product_name'],
            'qty' => $quantity,
            'price' => floatval($itemRow['unit_price'])
        ];
    }
    $row['items'] = $items;

    // Ensure numeric values
    $row['delivery_fee'] = isset($row['delivery_fee']) ? floatval($row['delivery_fee']) : 0.00;
    $row['total_amount'] = isset($row['total_amount']) ? floatval($row['total_amount']) : 0.00;
    $row['delivery_qty'] = $totalQuantity;

    $deliveries[] = $row;
}

// Return JSON
echo json_encode(['deliveries' => $deliveries]);

$stmt->close();
$stmt2->close();
$conn->close();
?>
