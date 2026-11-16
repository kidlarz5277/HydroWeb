<?php
session_start();
header('Content-Type: application/json');

// ✅ Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'User not logged in.']);
    exit;
}

// ✅ Database connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // ==============================
    // 🧩 Fetch Product Pricing
    // ==============================
    $stmt = $conn->prepare("
        SELECT 
            pp.product_id, 
            p.product_name, 
            p.category,            
            pp.unit_cost, 
            pp.unit_price,
            pp.status             
        FROM product_pricing pp
        INNER JOIN product p ON pp.product_id = p.product_id
        WHERE pp.user_id = ?
        ORDER BY p.category, p.product_name
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $productPricing = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // ==============================
    // 🚚 Fetch Delivery Pricing
    // ==============================
    $stmt2 = $conn->prepare("
        SELECT 
            deliveryprice_id, 
            area_name, 
            delivery_fee
        FROM delivery_pricing 
        WHERE user_id = ?
        ORDER BY area_name
    ");
    $stmt2->bind_param("i", $user_id);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $deliveryPricing = $result2->fetch_all(MYSQLI_ASSOC);
    $stmt2->close();

    // ✅ Return Combined JSON
    echo json_encode([
        'success' => true,
        'productPricing' => $productPricing,
        'deliveryPricing' => $deliveryPricing
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>
