<?php
session_start();
header('Content-Type: application/json');

// Replace with your DB credentials
$host = "localhost";
$db   = "hydroweb_db";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Handle cancel action
if (isset($_GET['action']) && $_GET['action'] === 'cancel') {
    $delivery_id = isset($_GET['delivery_id']) ? (int)$_GET['delivery_id'] : 0;

    if ($delivery_id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid delivery ID']);
        exit;
    }

    try {
        // Check if the delivery belongs to the user and get customer_id
        $stmtCheck = $pdo->prepare("SELECT delivery_id, customer_id FROM delivery_sales WHERE delivery_id = ? AND user_id = ?");
        $stmtCheck->execute([$delivery_id, $user_id]);

        $delivery = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        if (!$delivery) {
            echo json_encode(['success' => false, 'error' => 'Delivery not found or unauthorized']);
            exit;
        }

        $customer_id = $delivery['customer_id'];

        // Update delivery status to Cancelled
        $stmtUpdateSales = $pdo->prepare("UPDATE delivery_sales SET status = 'Cancelled' WHERE delivery_id = ?");
        $stmtUpdateSales->execute([$delivery_id]);

        $stmtUpdateItems = $pdo->prepare("UPDATE delivery_item SET status = 'Cancelled' WHERE delivery_id = ?");
        $stmtUpdateItems->execute([$delivery_id]);

        // Insert notification for customer
        $stmtNotification = $pdo->prepare("
            INSERT INTO notifications (customer_id, delivery_id, message, status, is_read, created_at)
            VALUES (?, ?, ?, 'Cancelled', 0, NOW())
        ");
        $message = "Your request order has been cancelled";
        $stmtNotification->execute([$customer_id, $delivery_id, $message]);

        echo json_encode(['success' => true, 'message' => 'Delivery status updated to Cancelled successfully']);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to cancel delivery: ' . $e->getMessage()]);
    }

    exit;
}

// Handle details action
if (isset($_GET['action']) && $_GET['action'] === 'details') {
    $delivery_id = isset($_GET['delivery_id']) ? (int)$_GET['delivery_id'] : 0;

    if ($delivery_id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid delivery ID']);
        exit;
    }

    try {
        // Fetch delivery info with delivery fee
        $stmtCheck = $pdo->prepare("
            SELECT 
                ds.delivery_id,
                COALESCE(ds.full_name, c.full_name) AS customer_name,
                COALESCE(ds.address, c.home_address) AS address,
                COALESCE(ds.phone_number, c.contact_no) AS phone_number,
                ds.total_amount AS total,
                dp.delivery_fee,
                ds.status,
                ds.created_at,
                ds.delivered_at
            FROM delivery_sales ds
            LEFT JOIN customers c ON ds.customer_id = c.customer_id
            LEFT JOIN delivery_pricing dp ON ds.deliveryprice_id = dp.deliveryprice_id
            WHERE ds.delivery_id = ? AND ds.user_id = ?
        ");
        $stmtCheck->execute([$delivery_id, $user_id]);
        $deliveryInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$deliveryInfo) {
            echo json_encode(['success' => false, 'error' => 'Unauthorized or delivery not found']);
            exit;
        }

        // Fetch delivery items
        $stmtItems = $pdo->prepare("
            SELECT 
                di.delivery_item_id,
                di.quantity,
                di.status,
                pp.pricing_id,
                pp.unit_price,
                p.product_name,
                pp.watervariant_id,
                CONCAT(IFNULL(wt.water_name, 'N/A'), ' / ', IFNULL(ws.size_label, 'N/A')) AS watervariant_name
            FROM delivery_item di
            LEFT JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
            LEFT JOIN product p ON pp.product_id = p.product_id
            LEFT JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
            LEFT JOIN water_type wt ON wv.water_id = wt.water_id
            LEFT JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            WHERE di.delivery_id = ?
        ");
        $stmtItems->execute([$delivery_id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'customer_name' => $deliveryInfo['customer_name'],
            'address' => $deliveryInfo['address'],
            'phone_number' => $deliveryInfo['phone_number'],
            'total' => $deliveryInfo['total'],
            'delivery_fee' => $deliveryInfo['delivery_fee'],
            'items' => $items
        ]);

    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Failed to fetch delivery items: ' . $e->getMessage()]);
    }

    exit;
}

// Default: fetch deliveries
$statuses = ['To Confirm', 'Pending', 'Delivered'];
$result = [];

try {
    foreach ($statuses as $status) {

        if ($status === 'To Confirm') {
            $stmt = $pdo->prepare("
                SELECT 
                    ds.delivery_id,
                    COALESCE(ds.full_name, c.full_name) AS customer_name,
                    COALESCE(ds.address, c.home_address) AS address,
                    COALESCE(ds.phone_number, c.contact_no) AS phone_number,
                    ds.total_amount AS total,
                    dp.delivery_fee,
                    ds.status,
                    ds.created_at,
                    ds.delivered_at
                FROM delivery_sales ds
                INNER JOIN customers c ON ds.customer_id = c.customer_id
                LEFT JOIN delivery_pricing dp ON ds.deliveryprice_id = dp.deliveryprice_id
                WHERE ds.user_id = ? AND ds.status = ?
                ORDER BY ds.created_at DESC
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    ds.delivery_id,
                    COALESCE(ds.full_name, c.full_name) AS customer_name,
                    COALESCE(ds.address, c.home_address) AS address,
                    COALESCE(ds.phone_number, c.contact_no) AS phone_number,
                    ds.total_amount AS total,
                    dp.delivery_fee,
                    ds.status,
                    ds.created_at,
                    ds.delivered_at
                FROM delivery_sales ds
                LEFT JOIN customers c ON ds.customer_id = c.customer_id
                LEFT JOIN delivery_pricing dp ON ds.deliveryprice_id = dp.deliveryprice_id
                WHERE ds.user_id = ? AND ds.status = ?
                ORDER BY ds.created_at DESC
            ");
        }

        $stmt->execute([$user_id, $status]);
        $deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result[$status] = $deliveries;
    }

    echo json_encode(['success' => true, 'data' => $result]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . $e->getMessage()]);
}
?>
