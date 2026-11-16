<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

$response = ["success" => false];

// 1️⃣ Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    $response['error'] = "User not logged in.";
    echo json_encode($response);
    exit;
}

$user_id = (int)$_SESSION['user_id'];

// 2️⃣ Get and validate JSON input
$data = json_decode(file_get_contents("php://input"), true);
if (json_last_error() !== JSON_ERROR_NONE || !isset($data['delivery_id'], $data['status'])) {
    http_response_code(400);
    $response['error'] = "Invalid input or missing required fields.";
    echo json_encode($response);
    exit;
}

$delivery_id = (int)$data['delivery_id'];
$status = trim($data['status']);

$mysqli = new mysqli("localhost", "root", "", "hydroweb_db");
if ($mysqli->connect_errno) {
    http_response_code(500);
    $response['error'] = "DB connection failed: " . $mysqli->connect_error;
    echo json_encode($response);
    exit;
}

// 2️⃣a Fetch logged-in user's shop_name
$stmtUser = $mysqli->prepare("SELECT shop_name FROM users WHERE user_id = ?");
$stmtUser->bind_param("i", $user_id);
$stmtUser->execute();
$stmtUser->bind_result($shop_name);
$stmtUser->fetch();
$stmtUser->close();

$mysqli->begin_transaction();

try {
    // 3️⃣ Verify delivery belongs to this user
    $stmt = $mysqli->prepare("
        SELECT ds.status, ds.customer_id
        FROM delivery_sales ds
        JOIN delivery_pricing dp ON ds.deliveryprice_id = dp.deliveryprice_id
        WHERE ds.delivery_id = ? AND dp.user_id = ?
    ");
    $stmt->bind_param("ii", $delivery_id, $user_id);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        throw new Exception("Invalid delivery ID or unauthorized access.");
    }

    $stmt->bind_result($currentStatus, $customer_id);
    $stmt->fetch();
    $stmt->close();

    if ($currentStatus === $status) {
        throw new Exception("Delivery already marked as $status.");
    }

    // Helper function to add notification
    function addNotification($mysqli, $customer_id, $delivery_id, $message, $notifStatus) {
        $stmtNotif = $mysqli->prepare("
            INSERT INTO notifications (customer_id, delivery_id, message, status) 
            VALUES (?, ?, ?, ?)
        ");
        $stmtNotif->bind_param("iiss", $customer_id, $delivery_id, $message, $notifStatus);
        $stmtNotif->execute();
        $stmtNotif->close();
    }

    // 4️⃣ Update delivery status and items
    if ($status === "Delivered") {
        $stmt = $mysqli->prepare("
            UPDATE delivery_sales 
            SET status = 'Delivered', delivered_at = NOW()
            WHERE delivery_id = ?
        ");
        $stmt->bind_param("i", $delivery_id);
        $stmt->execute();
        $stmt->close();
    } elseif ($status === "Pending") {
        $stmt = $mysqli->prepare("UPDATE delivery_sales SET status = 'Pending' WHERE delivery_id = ?");
        $stmt->bind_param("i", $delivery_id);
        $stmt->execute();
        $stmt->close();

        $stmt = $mysqli->prepare("UPDATE delivery_item SET status = 'Pending' WHERE delivery_id = ? AND status = 'To Confirm'");
        $stmt->bind_param("i", $delivery_id);
        $stmt->execute();
        $stmt->close();

        // ✅ Add notification for To Confirm → Pending
        if ($currentStatus === "To Confirm") {
            $message = "Your request order has been confirmed by $shop_name";
            addNotification($mysqli, $customer_id, $delivery_id, $message, "Confirmed");
        }
    } else {
        $stmt = $mysqli->prepare("UPDATE delivery_sales SET status = ? WHERE delivery_id = ?");
        $stmt->bind_param("si", $status, $delivery_id);
        $stmt->execute();
        $stmt->close();
    }

    // ✅ Add notification for Pending → Delivered
    if ($status === "Delivered" && $currentStatus === "Pending") {
        $message = "Your order has been delivered";
        addNotification($mysqli, $customer_id, $delivery_id, $message, "Delivered");
    }

    // 5️⃣ If delivered, update items, inventory, and water reserve
    if ($status === "Delivered") {
        $stmt = $mysqli->prepare("UPDATE delivery_item SET status = 'Delivered' WHERE delivery_id = ? AND status = 'Pending'");
        $stmt->bind_param("i", $delivery_id);
        $stmt->execute();
        $stmt->close();

        $stmt = $mysqli->prepare("
            SELECT di.delivery_item_id, pp.product_id, pp.watervariant_id, di.quantity
            FROM delivery_item di
            JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
            WHERE di.delivery_id = ?
        ");
        $stmt->bind_param("i", $delivery_id);
        $stmt->execute();
        $itemsResult = $stmt->get_result();
        $stmt->close();

        $now = date("Y-m-d H:i:s");

        while ($item = $itemsResult->fetch_assoc()) {
            $product_id      = isset($item['product_id']) ? (int)$item['product_id'] : 0;
            $watervariant_id = isset($item['watervariant_id']) ? (int)$item['watervariant_id'] : 0;
            $quantity        = isset($item['quantity']) ? (int)$item['quantity'] : 0;

            // Water reserve deduction
            if ($watervariant_id > 0) {
                $stmtVol = $mysqli->prepare("
                    SELECT ws.volume_liters
                    FROM water_variant wv
                    INNER JOIN water_size ws ON wv.watersize_id = ws.watersize_id
                    WHERE wv.watervariant_id = ?
                ");
                $stmtVol->bind_param("i", $watervariant_id);
                $stmtVol->execute();
                $resVol = $stmtVol->get_result();
                $stmtVol->close();
                if ($resVol->num_rows > 0) {
                    $volume_liters = (float) $resVol->fetch_assoc()['volume_liters'];
                    $deductLiters = $quantity * $volume_liters;

                    $stmtCheck = $mysqli->prepare("SELECT reserve_id, quantity_liters FROM water_reserve WHERE user_id = ? AND watervariant_id = ?");
                    $stmtCheck->bind_param("ii", $user_id, $watervariant_id);
                    $stmtCheck->execute();
                    $resCheck = $stmtCheck->get_result();
                    $stmtCheck->close();

                    if ($resCheck->num_rows > 0) {
                        $reserveRow = $resCheck->fetch_assoc();
                        $reserve_id = (int)$reserveRow['reserve_id'];
                        $available = (float)$reserveRow['quantity_liters'];
                        $newQty = max(0, $available - $deductLiters);

                        $stmtUpdate = $mysqli->prepare("UPDATE water_reserve SET quantity_liters = ? WHERE reserve_id = ?");
                        $stmtUpdate->bind_param("di", $newQty, $reserve_id);
                        $stmtUpdate->execute();
                        $stmtUpdate->close();

                        $stmtLog = $mysqli->prepare("INSERT INTO water_transaction (reserve_id, action, quantity_liters, transaction_date) VALUES (?, 'OUT', ?, ?)");
                        $stmtLog->bind_param("ids", $reserve_id, $deductLiters, $now);
                        $stmtLog->execute();
                        $stmtLog->close();
                    }
                }
            }

            // Product inventory deduction
            if ($product_id > 0) {
                $stmtInv = $mysqli->prepare("SELECT inventory_id, quantity FROM inventory WHERE user_id = ? AND product_id = ? LIMIT 1");
                $stmtInv->bind_param("ii", $user_id, $product_id);
                $stmtInv->execute();
                $resInv = $stmtInv->get_result();
                $stmtInv->close();

                if ($resInv->num_rows > 0) {
                    $invRow = $resInv->fetch_assoc();
                    $inventory_id = (int)$invRow['inventory_id'];
                    $current_qty = (int)$invRow['quantity'];
                    $new_qty = max(0, $current_qty - $quantity);

                    $stmtUpdateInv = $mysqli->prepare("UPDATE inventory SET quantity = ?, last_updated = ? WHERE inventory_id = ?");
                    $stmtUpdateInv->bind_param("isi", $new_qty, $now, $inventory_id);
                    $stmtUpdateInv->execute();
                    $stmtUpdateInv->close();
                } else {
                    $stmtInsertInv = $mysqli->prepare("INSERT INTO inventory (user_id, product_id, quantity, last_updated) VALUES (?, ?, 0, ?)");
                    $stmtInsertInv->bind_param("iis", $user_id, $product_id, $now);
                    $stmtInsertInv->execute();
                    $inventory_id = $stmtInsertInv->insert_id;
                    $stmtInsertInv->close();
                }

                $stmtTrans = $mysqli->prepare("INSERT INTO stock_transactions (inventory_id, action, quantity, transaction_date) VALUES (?, 'out', ?, ?)");
                $stmtTrans->bind_param("iis", $inventory_id, $quantity, $now);
                $stmtTrans->execute();
                $stmtTrans->close();
            }
        }
    }

    $mysqli->commit();
    $response['success'] = true;
    $response['message'] = "Delivery status updated and inventory/water reserve adjusted successfully.";
} catch (Exception $e) {
    $mysqli->rollback();
    http_response_code(500);
    $response['error'] = $e->getMessage();
}

$mysqli->close();
echo json_encode($response);
?>
