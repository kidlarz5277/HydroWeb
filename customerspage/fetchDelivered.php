<?php
error_reporting(E_ERROR | E_PARSE); // Hide warnings to ensure valid JSON
session_start();
header("Content-Type: application/json");

// Check login
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
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Customer not found']);
    exit;
}
$customer = $result->fetch_assoc();
$customer_id = $customer['customer_id'];

// Fetch only delivered deliveries with shop contact
$sql = "
    SELECT 
        d.delivery_id,
        d.status,
        d.address AS delivery_address,
        u.shop_name,
        u.business_address AS store_address,
        u.contact_no AS contact_no,   -- Shop contact
        c.home_address AS customer_home,
        dp.delivery_fee,
        d.delivered_at
    FROM delivery_sales d
    INNER JOIN users u ON d.user_id = u.user_id
    INNER JOIN customers c ON d.customer_id = c.customer_id
    LEFT JOIN delivery_pricing dp ON d.deliveryprice_id = dp.deliveryprice_id
    WHERE d.customer_id = ?
      AND d.status = 'Delivered'
    ORDER BY d.created_at DESC
";
$stmt2 = $conn->prepare($sql);
$stmt2->bind_param("i", $customer_id);
$stmt2->execute();
$result2 = $stmt2->get_result();

$deliveries = [];
while ($row = $result2->fetch_assoc()) {
    // Determine final address
    $row['final_address'] = !empty($row['delivery_address']) ? $row['delivery_address'] : $row['customer_home'];

    // Fetch delivery items
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
    $grandTotal = 0;
    $totalQty = 0;

    while ($itemRow = $itemResult->fetch_assoc()) {
        $total = $itemRow['unit_price'] * $itemRow['quantity'];
        $grandTotal += $total;
        $totalQty += $itemRow['quantity'];
        $items[] = [
            'product' => $itemRow['product_name'],
            'qty' => $itemRow['quantity'],
            'price' => floatval($itemRow['unit_price']),
            'total' => $total
        ];
    }

    // Add delivery fee * total quantity
    $delivery_fee = isset($row['delivery_fee']) ? floatval($row['delivery_fee']) : 0;
    $delivery_fee_total = $delivery_fee * $totalQty;
    $grandTotal += $delivery_fee_total;

    $row['items'] = $items;
    $row['grand_total'] = $grandTotal;
    $row['delivery_fee'] = $delivery_fee;
    $row['delivery_qty'] = $totalQty;
    $row['delivery_fee_total'] = $delivery_fee_total;

    $deliveries[] = $row;
}

// Return JSON
echo json_encode(['deliveries' => $deliveries]);

$stmt->close();
$stmt2->close();
$conn->close();
?>
