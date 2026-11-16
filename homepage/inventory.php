<?php
header('Content-Type: application/json');
session_start();

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Require login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Database connection
$host = "localhost";
$db   = "hydroweb_db";
$user = "root";
$pass = ""; // your password

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';

/* ================================================================
   ACTION 1: Get products available for stock-in
================================================================ */
if ($action === 'get_products') {
    $sql = "SELECT p.product_id, p.product_name, p.category
            FROM product p
            JOIN product_pricing pp ON p.product_id = pp.product_id
            WHERE pp.user_id = ? AND pp.status = 'Available'
            ORDER BY p.category, p.product_name";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $products_by_category = [];
    while ($row = $result->fetch_assoc()) {
        $products_by_category[$row['category']][] = $row;
    }

    echo json_encode(['success' => true, 'data' => $products_by_category]);
}

/* ================================================================
   ACTION 2: Get current inventory for stock-out
================================================================ */
elseif ($action === 'get_inventory') {
    $sql = "SELECT i.inventory_id, p.product_id, p.product_name, p.category, i.quantity
            FROM inventory i
            JOIN product p ON i.product_id = p.product_id
            WHERE i.user_id = ? AND i.quantity > 0
            ORDER BY p.category, p.product_name";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $products_by_category = [];
    while ($row = $result->fetch_assoc()) {
        $products_by_category[$row['category']][] = $row;
    }

    echo json_encode(['success' => true, 'data' => $products_by_category]);
}

/* ================================================================
   ACTION 3: Stock-In (Add or update inventory)
================================================================ */
elseif ($action === 'stock_in') {
    $input = json_decode(file_get_contents("php://input"), true);
    $product_id = $input['product_id'] ?? 0;
    $quantity = $input['quantity'] ?? 0;

    if (!$product_id || !$quantity || $quantity <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid product or quantity']);
        exit;
    }

    $conn->begin_transaction();

    try {
        $check = $conn->prepare("SELECT inventory_id, quantity FROM inventory WHERE user_id = ? AND product_id = ?");
        $check->bind_param("ii", $user_id, $product_id);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $inventory_id = $row['inventory_id'];

            $update = $conn->prepare("
                UPDATE inventory 
                SET quantity = quantity + ?, last_updated = CONCAT(CURDATE(), ' ', CURTIME()) 
                WHERE inventory_id = ?
            ");
            $update->bind_param("ii", $quantity, $inventory_id);
            $update->execute();
        } else {
            $insert = $conn->prepare("
                INSERT INTO inventory (user_id, product_id, quantity, last_updated) 
                VALUES (?, ?, ?, CONCAT(CURDATE(), ' ', CURTIME()))
            ");
            $insert->bind_param("iii", $user_id, $product_id, $quantity);
            $insert->execute();
            $inventory_id = $insert->insert_id;
        }

        $trans = $conn->prepare("
            INSERT INTO stock_transactions (inventory_id, action, quantity, transaction_date) 
            VALUES (?, 'in', ?, CONCAT(CURDATE(), ' ', CURTIME()))
        ");
        $trans->bind_param("ii", $inventory_id, $quantity);
        $trans->execute();

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/* ================================================================
   ACTION 4: Stock-Out (Deduct from inventory)
================================================================ */
elseif ($action === 'stock_out') {
    $input = json_decode(file_get_contents("php://input"), true);
    $product_id = $input['product_id'] ?? 0;
    $quantity = $input['quantity'] ?? 0;

    if (!$product_id || !$quantity || $quantity <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid product or quantity']);
        exit;
    }

    $conn->begin_transaction();

    try {
        $check = $conn->prepare("SELECT inventory_id, quantity FROM inventory WHERE user_id = ? AND product_id = ?");
        $check->bind_param("ii", $user_id, $product_id);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            throw new Exception("Product not found in inventory.");
        }

        $row = $result->fetch_assoc();
        $inventory_id = $row['inventory_id'];
        $current_qty = $row['quantity'];

        if ($current_qty < $quantity) {
            throw new Exception("Insufficient stock. Available: $current_qty");
        }

        $update = $conn->prepare("
            UPDATE inventory 
            SET quantity = quantity - ?, last_updated = CONCAT(CURDATE(), ' ', CURTIME()) 
            WHERE inventory_id = ?
        ");
        $update->bind_param("ii", $quantity, $inventory_id);
        $update->execute();

        $trans = $conn->prepare("
            INSERT INTO stock_transactions (inventory_id, action, quantity, transaction_date) 
            VALUES (?, 'out', ?, CONCAT(CURDATE(), ' ', CURTIME()))
        ");
        $trans->bind_param("ii", $inventory_id, $quantity);
        $trans->execute();

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/* ================================================================
   ACTION 5: Get Water Reserve for current user
================================================================ */
elseif ($action === 'get_water_reserve') {
    // Fetch all available water variants in product_pricing for this user
    $stmt = $conn->prepare("
        SELECT wt.water_name, ws.size_label, pp.unit_price, pp.pricing_id, wv.watervariant_id
        FROM product_pricing pp
        JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
        JOIN water_size ws ON wv.watersize_id = ws.watersize_id
        JOIN water_type wt ON wv.water_id = wt.water_id
        WHERE pp.user_id = ?
          AND pp.watervariant_id IS NOT NULL
          AND pp.status = 'Available'
        ORDER BY wt.water_name, ws.size_label
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 6: Add to Water Reserve + Water Transaction
================================================================ */
elseif ($action === 'add_water_reserve') {
    $input = json_decode(file_get_contents("php://input"), true);
    $watervariant_id = $input['watervariant_id'] ?? 0;
    $quantity_liters = $input['quantity_liters'] ?? 0;

    if (!$watervariant_id || !$quantity_liters || $quantity_liters <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid watervariant or quantity']);
        exit;
    }

    $conn->begin_transaction();

    try {
        // Check if user already has a reserve entry
        $check = $conn->prepare("
            SELECT reserve_id, quantity_liters 
            FROM water_reserve 
            WHERE user_id = ? AND watervariant_id = ?
        ");
        $check->bind_param("ii", $user_id, $watervariant_id);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            // Update existing reserve and refresh reserved_at timestamp
            $row = $result->fetch_assoc();
            $reserve_id = $row['reserve_id'];

            $update = $conn->prepare("
                UPDATE water_reserve 
                SET quantity_liters = quantity_liters + ?, 
                    reserved_at = CURRENT_TIMESTAMP
                WHERE reserve_id = ?
            ");
            $update->bind_param("di", $quantity_liters, $reserve_id);
            $update->execute();
        } else {
            // Insert new reserve record
            $insert = $conn->prepare("
                INSERT INTO water_reserve (user_id, watervariant_id, quantity_liters, reserved_at) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ");
            $insert->bind_param("iid", $user_id, $watervariant_id, $quantity_liters);
            $insert->execute();
            $reserve_id = $insert->insert_id;
        }

        // Insert water transaction (link to reserve_id)
        $trans = $conn->prepare("
            INSERT INTO water_transaction (reserve_id, action, quantity_liters, transaction_date) 
            VALUES (?, 'IN', ?, CURRENT_TIMESTAMP)
        ");
        $trans->bind_param("id", $reserve_id, $quantity_liters);
        $trans->execute();

        $conn->commit();
        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

/* ================================================================
   ACTION 7: Get Current Inventory Table
================================================================ */
elseif ($action === 'get_inventory_table') {
    $sql = "SELECT p.product_name, p.category, i.quantity, i.last_updated
            FROM inventory i
            JOIN product p ON i.product_id = p.product_id
            WHERE i.user_id = ?
            ORDER BY p.category, p.product_name";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 8: Get Water Reserve Table
================================================================ */
elseif ($action === 'get_water_reserve_table') {
    $sql = "SELECT wt.water_name, ws.size_label, wr.quantity_liters, wr.reserved_at
            FROM water_reserve wr
            JOIN water_variant wv ON wr.watervariant_id = wv.watervariant_id
            JOIN water_type wt ON wv.water_id = wt.water_id
            JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            WHERE wr.user_id = ?
            ORDER BY wt.water_name, ws.size_label";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}
/* ================================================================
   ACTION 9: Get Inventory History Records
================================================================ */
elseif ($action === 'get_inventory_history') {
    $sql = "SELECT 
                p.product_name, 
                p.category, 
                st.quantity, 
                st.action, 
                st.transaction_date
            FROM stock_transactions st
            INNER JOIN inventory i ON st.inventory_id = i.inventory_id
            INNER JOIN product p ON i.product_id = p.product_id
            WHERE i.user_id = ?
            ORDER BY st.transaction_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

// ================================================================
// ACTION 10: Get Water Reserve Transaction History
// ================================================================
elseif ($action === 'get_water_history') {

    // Prepare SQL to fetch only the needed columns
    $sql = "SELECT 
                wt.water_name, 
                ws.size_label, 
                wt2.action, 
                wt2.transaction_date
            FROM water_transaction wt2
            INNER JOIN water_reserve wr ON wt2.reserve_id = wr.reserve_id
            INNER JOIN water_variant wv ON wr.watervariant_id = wv.watervariant_id
            INNER JOIN water_type wt ON wv.water_id = wt.water_id
            INNER JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            WHERE wr.user_id = ?
            ORDER BY wt2.transaction_date DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 11: Get Sales Records
================================================================ */
elseif ($action === 'get_sales') {
    $sql = "SELECT sale_id, sale_date, total_amount
            FROM sales
            WHERE user_id = ?
            ORDER BY sale_date DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 12: Get Sale Details by Sale ID
================================================================ */
elseif ($action === 'get_sale_details') {
    $sale_id = $_GET['sale_id'] ?? 0;

    if (!$sale_id) {
        echo json_encode(['success' => false, 'error' => 'Missing sale_id']);
        exit;
    }

    // Build query
    $sql = "
        SELECT 
            si.sale_item_id, 
            si.quantity,
            -- If watervariant exists, use water_name + size_label; otherwise product_name
            CASE 
                WHEN pp.watervariant_id IS NOT NULL THEN CONCAT(wt.water_name, ' (', ws.size_label, ')')
                ELSE p.product_name
            END AS product,
            p.category,
            pp.unit_price
        FROM sale_item si
        INNER JOIN product_pricing pp ON si.pricing_id = pp.pricing_id
        LEFT JOIN product p ON pp.product_id = p.product_id
        LEFT JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
        LEFT JOIN water_type wt ON wv.water_id = wt.water_id
        LEFT JOIN water_size ws ON wv.watersize_id = ws.watersize_id
        WHERE si.sale_id = ?
        ORDER BY si.sale_item_id ASC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $sale_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 13: Get Deliveries (Delivered Only)
================================================================ */
elseif ($action === 'get_deliveries') {
    $sql = "
        SELECT 
            ds.delivery_id,
            COALESCE(ds.full_name, c.full_name) AS full_name,
            COALESCE(ds.address, c.home_address) AS address,
            COALESCE(ds.phone_number, c.contact_no) AS phone_number,
            ds.total_amount,
            ds.status,
            ds.created_at,
            ds.delivered_at
        FROM delivery_sales ds
        LEFT JOIN customers c ON ds.customer_id = c.customer_id
        WHERE ds.user_id = ? AND ds.status = 'Delivered'
        ORDER BY ds.created_at DESC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   ACTION 14: Get Delivery Items by Delivery ID
================================================================ */
elseif ($action === 'get_delivery_items') {
    $delivery_id = $_GET['delivery_id'] ?? 0;

    if (!$delivery_id) {
        echo json_encode(['success' => false, 'error' => 'Missing delivery_id']);
        exit;
    }

    $sql = "
        SELECT 
            di.delivery_item_id,
            di.quantity,
            di.status,
            -- Get product/water name like in sale details
            CASE 
                WHEN pp.watervariant_id IS NOT NULL THEN CONCAT(IFNULL(wt.water_name, 'N/A'), ' (', IFNULL(ws.size_label, 'N/A'), ')')
                ELSE IFNULL(p.product_name, 'N/A')
            END AS product,
            IFNULL(p.category, 'N/A') AS category,
            pp.unit_price
        FROM delivery_item di
        INNER JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
        LEFT JOIN product p ON pp.product_id = p.product_id
        LEFT JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
        LEFT JOIN water_type wt ON wv.water_id = wt.water_id
        LEFT JOIN water_size ws ON wv.watersize_id = ws.watersize_id
        WHERE di.delivery_id = ?
        ORDER BY di.delivery_item_id ASC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    $stmt->bind_param("i", $delivery_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}


/* ================================================================
   ACTION 15: Add Water Meter Reading + Auto Sales Report (JSON-safe)
================================================================ */
elseif ($action === 'add_water_meter') {

    try {
        $input = json_decode(file_get_contents("php://input"), true);

        // Validate input
        $reading_value = isset($input['reading_value']) ? floatval($input['reading_value']) : 0;
        if ($reading_value <= 0) {
            throw new Exception("Invalid water meter value");
        }

        // 1. Get previous meter
        $prev = $conn->query("
            SELECT meter_id, reading_value, reading_date 
            FROM water_meter 
            WHERE user_id = $user_id 
            ORDER BY meter_id DESC LIMIT 1
        ");

        // Check if this is the first ever water meter
        $isFirstMeter = (!$prev || $prev->num_rows === 0);

        if ($isFirstMeter) {
            // Insert the first meter without generating sales report
            $stmt = $conn->prepare("
                INSERT INTO water_meter (reading_value, user_id, reading_date)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            ");
            $stmt->bind_param("di", $reading_value, $user_id);
            $stmt->execute();

            echo json_encode([
                'success' => true,
                'message' => 'First water meter added. No sales report generated.'
            ]);
            exit;
        }

        // Not the first meter — continue with normal sales report logic
        $prev_data = $prev->fetch_assoc();
        $prev_value = floatval($prev_data['reading_value']);
        $start_date = $prev_data['reading_date'];

        // 2. Insert new meter
        $stmt = $conn->prepare("
            INSERT INTO water_meter (reading_value, user_id, reading_date)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->bind_param("di", $reading_value, $user_id);
        $stmt->execute();
        $new_meter_id = $stmt->insert_id;

        // 3. Get new meter timestamp
        $new = $conn->query("
            SELECT reading_date FROM water_meter WHERE meter_id = $new_meter_id
        ")->fetch_assoc();
        $end_date = $new['reading_date'];

        // 4. Calculate meter difference in liters
        $meter_diff_liters = ($reading_value - $prev_value) * 1000;

        // 5. Delivery sales in datetime range
        $delivery_sales = floatval($conn->query("
            SELECT SUM(di.quantity * pp.unit_price) AS total
            FROM delivery_item di
            JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
            JOIN delivery_sales ds ON di.delivery_id = ds.delivery_id
            WHERE ds.created_at BETWEEN '$start_date' AND '$end_date'
              AND ds.status = 'Delivered'
              AND pp.user_id = $user_id
        ")->fetch_assoc()['total'] ?? 0);

        // 6. Cashier sales in datetime range
        $cashier_sales = floatval($conn->query("
            SELECT SUM(si.quantity * pp.unit_price) AS total
            FROM sale_item si
            JOIN product_pricing pp ON si.pricing_id = pp.pricing_id
            JOIN sales s ON si.sale_id = s.sale_id
            WHERE CONCAT(s.sale_date, ' 00:00:00') BETWEEN '$start_date' AND '$end_date'
              AND pp.user_id = $user_id
        ")->fetch_assoc()['total'] ?? 0);

        $total_sales = $delivery_sales + $cashier_sales;

        // 7. Total volume sold in liters (FIXED JOIN)
        $volume_liters = floatval($conn->query("
            SELECT SUM(di.quantity * ws.volume_liters) AS liters
            FROM delivery_item di
            JOIN product_pricing pp ON di.pricing_id = pp.pricing_id
            JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
            JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            JOIN delivery_sales ds ON di.delivery_id = ds.delivery_id
            WHERE ds.created_at BETWEEN '$start_date' AND '$end_date'
              AND ds.status = 'Delivered'
              AND pp.user_id = $user_id
        ")->fetch_assoc()['liters'] ?? 0);

        $volume_liters += floatval($conn->query("
            SELECT SUM(si.quantity * ws.volume_liters) AS liters
            FROM sale_item si
            JOIN product_pricing pp ON si.pricing_id = pp.pricing_id
            JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
            JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            JOIN sales s ON si.sale_id = s.sale_id
            WHERE CONCAT(s.sale_date, ' 00:00:00') BETWEEN '$start_date' AND '$end_date'
              AND pp.user_id = $user_id
        ")->fetch_assoc()['liters'] ?? 0);

        // 8. Compute variance in cubic meters
        $variance = ($meter_diff_liters - $volume_liters) / 1000;

        // 9. Insert into sales_report
        $stmt2 = $conn->prepare("
            INSERT INTO sales_report (total_sales, variance_meter, user_id, report_start, report_end)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt2->bind_param("ddiss", $total_sales, $variance, $user_id, $start_date, $end_date);
        $stmt2->execute();

        // 10. Return JSON response
        echo json_encode([
            'success' => true,
            'total_sales' => $total_sales,
            'variance_meter' => $variance
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
        exit;
    }
}


/* ================================================================
   ACTION 16: Get Sales Report
================================================================ */
elseif ($action === 'get_sales_report') {
    $sql = "SELECT report_id, total_sales, variance_meter, report_start, report_end
            FROM sales_report
            WHERE user_id = ?
            ORDER BY report_start DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $data]);
}

/* ================================================================
   CHECK WATER METER
================================================================ */
elseif ($action === 'check_water_meter') {
    $sql = "SELECT meter_id FROM water_meter WHERE user_id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $has_meter = $result->num_rows > 0;
    
    echo json_encode(['success' => true, 'has_meter' => $has_meter]);
}

/* ================================================================
   INVALID ACTION
================================================================ */
else {
    echo json_encode([
        'success' => false,
        'error' => 'Missing or invalid action',
        'received' => $action
    ]);
}

$conn->close();
?>
