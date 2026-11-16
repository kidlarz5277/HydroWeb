<?php
header('Content-Type: application/json');

// Database connection
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "hydroweb_db";

$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Get shop_name from URL
$shop_name = isset($_GET['shop_name']) ? $_GET['shop_name'] : '';

if (empty($shop_name)) {
    echo json_encode(["error" => "No shop name provided"]);
    exit;
}

// Prepare SQL to get only "Available" products for the shop
$sql = "
SELECT 
    pp.pricing_id,
    pp.product_id,
    pp.watervariant_id,
    pp.unit_price,
    pp.status,
    p.product_name,
    p.category,
    wt.water_name,
    ws.volume_liters,
    COALESCE(i.quantity, 0) AS quantity
FROM product_pricing pp
JOIN users u ON pp.user_id = u.user_id
LEFT JOIN product p ON pp.product_id = p.product_id
LEFT JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
LEFT JOIN water_type wt ON wv.water_id = wt.water_id
LEFT JOIN water_size ws ON wv.watersize_id = ws.watersize_id
LEFT JOIN inventory i ON i.product_id = pp.product_id 
                      AND i.user_id = pp.user_id
WHERE u.shop_name = ? 
  AND pp.status = 'Available'
ORDER BY p.category, ws.volume_liters DESC, pp.pricing_id ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $shop_name);
$stmt->execute();

$result = $stmt->get_result();

$products = [];

while ($row = $result->fetch_assoc()) {
    // Keep product_id and watervariant_id even if NULL
    $products[] = [
        "pricing_id" => $row['pricing_id'],
        "product_id" => $row['product_id'],            // can be null
        "watervariant_id" => $row['watervariant_id'],  // can be null
        "unit_price" => $row['unit_price'],
        "status" => $row['status'],
        "product_name" => $row['product_name'],
        "category" => $row['category'],
        "water_name" => $row['water_name'],
        "volume_liters" => $row['volume_liters'],
        "quantity" => $row['quantity']                // ADDED QUANTITY
    ];
}

echo json_encode($products);

// Close connections
$stmt->close();
$conn->close();
?>
