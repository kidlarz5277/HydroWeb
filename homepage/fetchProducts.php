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
   🟢 PART 1: Handle Confirm Sale (POST with action=save)
========================================================= */
if (isset($_GET['action']) && $_GET['action'] === 'save') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['items']) || !isset($data['total'])) {
        echo json_encode(['error' => 'Invalid data']);
        exit;
    }

    $conn->begin_transaction();
    try {
        // Insert sale record using DATETIME
        $stmtSale = $conn->prepare("INSERT INTO sales (sale_date, total_amount, user_id) VALUES (NOW(), ?, ?)");
        $stmtSale->bind_param("di", $data['total'], $user_id);
        $stmtSale->execute();
        $sale_id = $conn->insert_id;

        // Loop through cart items
        foreach ($data['items'] as $item) {
            $product_id = $item['product_id'] ?? null;
            $watervariant_id = $item['watervariant_id'] ?? null;
            $qty = $item['quantity'];
            $useReserve = isset($item['useReserve']) && $item['useReserve'];

            // Validate at least one ID exists
            if (!$product_id && !$watervariant_id) {
                throw new Exception("No valid product ID provided");
            }

            /* =========================================================
               Get pricing_id based on water or non-water
            ========================================================= */
            if ($watervariant_id) {
                // Water product
                $stmtPrice = $conn->prepare("
                    SELECT pricing_id
                    FROM product_pricing
                    WHERE watervariant_id = ? AND user_id = ?
                    LIMIT 1
                ");
                $stmtPrice->bind_param("ii", $watervariant_id, $user_id);
            } else {
                // Non-water product
                $stmtPrice = $conn->prepare("
                    SELECT pricing_id
                    FROM product_pricing
                    WHERE product_id = ? AND user_id = ?
                    LIMIT 1
                ");
                $stmtPrice->bind_param("ii", $product_id, $user_id);
            }

            $stmtPrice->execute();
            $resPrice = $stmtPrice->get_result();
            if ($resPrice->num_rows === 0) {
                throw new Exception("Pricing not found for this item");
            }
            $pricing_id = $resPrice->fetch_assoc()['pricing_id'];

            // Insert sale item
            $stmtItem = $conn->prepare("INSERT INTO sale_item (quantity, sale_id, pricing_id) VALUES (?, ?, ?)");
            $stmtItem->bind_param("iii", $qty, $sale_id, $pricing_id);
            $stmtItem->execute();

            /* =========================================================
               💧 WATER RESERVE DEDUCTION
            ========================================================= */
            if (!empty($watervariant_id) && $useReserve) {
                $stmtVol = $conn->prepare("
                    SELECT ws.volume_liters
                    FROM water_variant wv
                    INNER JOIN water_size ws ON wv.watersize_id = ws.watersize_id
                    WHERE wv.watervariant_id = ?
                ");
                $stmtVol->bind_param("i", $watervariant_id);
                $stmtVol->execute();
                $resVol = $stmtVol->get_result();
                if ($resVol->num_rows === 0) {
                    throw new Exception("Water size not found for watervariant_id $watervariant_id");
                }
                $volume_liters = (float)$resVol->fetch_assoc()['volume_liters'];

                $deductLiters = $qty * $volume_liters;

                $stmtCheck = $conn->prepare("SELECT reserve_id, quantity_liters FROM water_reserve WHERE user_id = ? AND watervariant_id = ?");
                $stmtCheck->bind_param("ii", $user_id, $watervariant_id);
                $stmtCheck->execute();
                $resCheck = $stmtCheck->get_result();

                if ($resCheck->num_rows === 0) {
                    throw new Exception("No water reserve found for product");
                }

                $reserveRow = $resCheck->fetch_assoc();
                $reserve_id = $reserveRow['reserve_id'];
                $available = (float)$reserveRow['quantity_liters'];
                if ($available < $deductLiters) {
                    throw new Exception("Not enough water reserve for item");
                }

                $stmtUpdate = $conn->prepare("UPDATE water_reserve SET quantity_liters = quantity_liters - ? WHERE reserve_id = ?");
                $stmtUpdate->bind_param("di", $deductLiters, $reserve_id);
                $stmtUpdate->execute();

                $stmtLog = $conn->prepare("INSERT INTO water_transaction (reserve_id, action, quantity_liters, transaction_date) VALUES (?, 'OUT', ?, NOW())");
                $stmtLog->bind_param("id", $reserve_id, $deductLiters);
                $stmtLog->execute();
            }

            /* =========================================================
               💼 INVENTORY DEDUCTION FOR NON-WATER PRODUCTS
            ========================================================= */
            if (!empty($product_id)) {
                $stmtInv = $conn->prepare("SELECT inventory_id, quantity FROM inventory WHERE user_id = ? AND product_id = ? LIMIT 1");
                $stmtInv->bind_param("ii", $user_id, $product_id);
                $stmtInv->execute();
                $resInv = $stmtInv->get_result();

                if ($resInv->num_rows === 0) {
                    throw new Exception("No inventory record found for product $product_id");
                }

                $invRow = $resInv->fetch_assoc();
                $inventory_id = $invRow['inventory_id'];
                $availableQty = (int)$invRow['quantity'];
                if ($availableQty < $qty) {
                    throw new Exception("Not enough inventory for product $product_id");
                }

                $stmtUpdateInv = $conn->prepare("UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?");
                $stmtUpdateInv->bind_param("ii", $qty, $inventory_id);
                $stmtUpdateInv->execute();

                $stmtTrans = $conn->prepare("INSERT INTO stock_transactions (inventory_id, action, quantity, transaction_date) VALUES (?, 'out', ?, NOW())");
                $stmtTrans->bind_param("ii", $inventory_id, $qty);
                $stmtTrans->execute();
            }
        }

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

/* =========================================================
   🟦 PART 2: Fetch Products by Category
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
            WHERE pp.user_id = ? 
              AND pp.status = 'Available'
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
