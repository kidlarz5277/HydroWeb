<?php
session_start();
header('Content-Type: application/json');

// Check login
if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

// DB connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Get user_id
$username = $_SESSION['username'];
$stmtUser = $conn->prepare("SELECT user_id FROM users WHERE user_name = ?");
$stmtUser->bind_param("s", $username);
$stmtUser->execute();
$resUser = $stmtUser->get_result();
if ($resUser->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}
$user_id = $resUser->fetch_assoc()['user_id'];

/* =========================================================
   🟢 PART A: FETCH DELIVERY AREAS (DROPDOWN DATA)
========================================================= */
if (isset($_GET['action']) && $_GET['action'] === 'areas') {
    $stmt = $conn->prepare("
        SELECT deliveryprice_id, area_name, delivery_fee 
        FROM delivery_pricing 
        WHERE user_id = ?
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();

    $areas = [];
    while ($row = $res->fetch_assoc()) {
        $areas[] = $row;
    }
    echo json_encode($areas);
    exit;
}

/* =========================================================
   🟢 PART B: Handle Confirm Sale (POST with action=save)
   ✂️ Inventory and Water Reserve Deduction Removed
   🔹 Added delivery fee to total
========================================================= */
if (isset($_GET['action']) && $_GET['action'] === 'save') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (
        !$data || 
        !isset($data['items']) || 
        !isset($data['total']) || 
        !isset($data['full_name']) || 
        !isset($data['address']) || 
        !isset($data['phone_number']) || 
        !isset($data['deliveryprice_id'])
    ) {
        echo json_encode(['error' => 'Invalid data']);
        exit;
    }

    $full_name        = $data['full_name'];
    $address          = $data['address'];
    $phone_number     = $data['phone_number'];
    $deliveryprice_id = $data['deliveryprice_id'];
    $total_amount     = $data['total'];

    // Fetch delivery fee
    $stmtFee = $conn->prepare("SELECT delivery_fee FROM delivery_pricing WHERE deliveryprice_id = ? AND user_id = ?");
    $stmtFee->bind_param("ii", $deliveryprice_id, $user_id);
    $stmtFee->execute();
    $resFee = $stmtFee->get_result();
    if ($resFee->num_rows === 0) {
        echo json_encode(['error' => 'Delivery area not found']);
        exit;
    }
    $delivery_fee = $resFee->fetch_assoc()['delivery_fee'];

    // Add delivery fee to total amount
    $total_amount += $delivery_fee;

    $conn->begin_transaction();
    try {
        // Insert into delivery_sales table
        $stmtSale = $conn->prepare("
            INSERT INTO delivery_sales (user_id, full_name, address, phone_number, deliveryprice_id, total_amount, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())
        ");
        $stmtSale->bind_param("isssid", $user_id, $full_name, $address, $phone_number, $deliveryprice_id, $total_amount);
        $stmtSale->execute();
        $delivery_id = $conn->insert_id;

        // Loop through cart items
        foreach ($data['items'] as $item) {
            $product_id      = $item['product_id'] ?? null;
            $watervariant_id = $item['watervariant_id'] ?? null;
            $qty             = $item['quantity'];

            if (!$product_id && !$watervariant_id) {
                throw new Exception("No valid product ID provided");
            }

            // Get pricing_id from product_pricing
            if ($watervariant_id) {
                $stmtPrice = $conn->prepare("
                    SELECT pricing_id FROM product_pricing 
                    WHERE watervariant_id = ? AND user_id = ? LIMIT 1
                ");
                $stmtPrice->bind_param("ii", $watervariant_id, $user_id);
            } else {
                $stmtPrice = $conn->prepare("
                    SELECT pricing_id FROM product_pricing 
                    WHERE product_id = ? AND user_id = ? LIMIT 1
                ");
                $stmtPrice->bind_param("ii", $product_id, $user_id);
            }
            $stmtPrice->execute();
            $resPrice = $stmtPrice->get_result();
            if ($resPrice->num_rows === 0) throw new Exception("Pricing not found");
            $pricing_id = $resPrice->fetch_assoc()['pricing_id'];

            // Insert into delivery_item
            $stmtItem = $conn->prepare("INSERT INTO delivery_item (quantity, delivery_id, pricing_id) VALUES (?, ?, ?)");
            $stmtItem->bind_param("iii", $qty, $delivery_id, $pricing_id);
            $stmtItem->execute();
        }

        $conn->commit();
        echo json_encode(['success' => true, 'delivery_id' => $delivery_id, 'total_amount' => $total_amount]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

/* =========================================================
   🟦 PART C: Fetch Products by Category  (UNCHANGED)
========================================================= */
$category = $_GET['category'] ?? '';
$products = [];

switch (strtolower($category)) {
    case 'water':
        $sql = "
            SELECT 
                wv.watervariant_id,
                CONCAT(wt.water_name, ' - ', ws.size_label) AS product_name,
                wt.description,
                pp.unit_price,
                pp.status
            FROM product_pricing pp
            INNER JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
            INNER JOIN water_type wt ON wv.water_id = wt.water_id
            INNER JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            WHERE pp.user_id = ? AND pp.status = 'Available'
            ORDER BY wt.water_name, ws.volume_liters
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        break;

    case 'container':
        $sql = "
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                pp.unit_price,
                i.quantity
            FROM product p
            INNER JOIN product_pricing pp ON p.product_id = pp.product_id
            INNER JOIN inventory i ON p.product_id = i.product_id
            WHERE p.category = 'Containers'
              AND i.user_id = ?
              AND pp.user_id = ?
              AND i.quantity > 0
              AND pp.status = 'Available'
            ORDER BY p.product_name
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $user_id);
        break;

    case 'other':
        $sql = "
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                pp.unit_price,
                i.quantity
            FROM product p
            INNER JOIN product_pricing pp ON p.product_id = pp.product_id
            INNER JOIN inventory i ON p.product_id = i.product_id
            WHERE p.category = 'Others'
              AND i.user_id = ?
              AND pp.user_id = ?
              AND i.quantity > 0
              AND pp.status = 'Available'
            ORDER BY p.product_name
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $user_id);
        break;

    default:
        echo json_encode(['error' => 'Invalid category']);
        exit;
}

$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

echo json_encode($products);
?>
