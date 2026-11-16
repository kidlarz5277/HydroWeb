<?php
session_start();
header('Content-Type: application/json');

// ✅ Require login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

// ✅ Database connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// ✅ Get requested action
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // =======================================================
    // 1️⃣ Fetch all water types
    // =======================================================
    case 'fetch_waters':
        $result = $conn->query("SELECT water_id, water_name, description FROM water_type ORDER BY water_id ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // =======================================================
    // 2️⃣ Fetch all available sizes
    // =======================================================
    case 'fetch_sizes':
        $result = $conn->query("SELECT watersize_id, size_label, volume_liters FROM water_size ORDER BY volume_liters DESC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // =======================================================
    // 3️⃣ Fetch all saved pricing
    // =======================================================
    case 'fetch_pricing':
        $query = "
            SELECT 
                pp.pricing_id,
                wt.water_name,
                ws.size_label,
                ws.volume_liters,
                pp.unit_cost,
                pp.unit_price,
                pp.status,
                pp.date_effective
            FROM product_pricing pp
            INNER JOIN water_variant wv ON pp.watervariant_id = wv.watervariant_id
            INNER JOIN water_type wt ON wv.water_id = wt.water_id
            INNER JOIN water_size ws ON wv.watersize_id = ws.watersize_id
            WHERE pp.user_id = ?
            ORDER BY wt.water_name ASC, ws.volume_liters DESC
        ";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode(['success' => true, 'data' => $data]);
        break;

    // =======================================================
    // 4️⃣ BULK SAVE PRICING (with date_effective = CURDATE())
    // =======================================================
    case 'bulk_save_pricing':
        $data = json_decode($_POST['data'] ?? '[]', true);
        if (empty($data)) {
            echo json_encode(['success' => false, 'error' => 'No data received.']);
            exit;
        }

        $conn->begin_transaction();
        try {
            foreach ($data as $item) {
                $water_id = intval($item['water_id']);
                $watersize_id = intval($item['watersize_id']);
                $unit_cost = floatval($item['unit_cost']);
                $unit_price = floatval($item['unit_price']);
                $status = $item['status'] ?? 'Not Available';

                // Ensure water_variant exists
                $variantQuery = $conn->prepare("SELECT watervariant_id FROM water_variant WHERE water_id = ? AND watersize_id = ?");
                $variantQuery->bind_param("ii", $water_id, $watersize_id);
                $variantQuery->execute();
                $variantRes = $variantQuery->get_result();

                if ($variantRes->num_rows > 0) {
                    $variant = $variantRes->fetch_assoc();
                    $watervariant_id = $variant['watervariant_id'];
                } else {
                    $insertVariant = $conn->prepare("INSERT INTO water_variant (water_id, watersize_id) VALUES (?, ?)");
                    $insertVariant->bind_param("ii", $water_id, $watersize_id);
                    $insertVariant->execute();
                    $watervariant_id = $insertVariant->insert_id;
                }

                // Prevent duplicate
                $check = $conn->prepare("SELECT pricing_id FROM product_pricing WHERE watervariant_id = ? AND user_id = ?");
                $check->bind_param("ii", $watervariant_id, $user_id);
                $check->execute();
                $exists = $check->get_result()->fetch_assoc();

                if ($exists) {
                    continue;
                }

                // Insert new pricing with CURDATE()
                $insert = $conn->prepare("
                    INSERT INTO product_pricing (unit_cost, unit_price, date_effective, watervariant_id, user_id, status)
                    VALUES (?, ?, CURDATE(), ?, ?, ?)
                ");
                $insert->bind_param("ddiis", $unit_cost, $unit_price, $watervariant_id, $user_id, $status);
                $insert->execute();
            }

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Water pricing saved successfully.']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'error' => 'Failed to save pricing: ' . $e->getMessage()]);
        }
        break;

    // =======================================================
    // 5️⃣ UPDATE EXISTING PRICING INLINE (with CURDATE())
    // =======================================================
    case 'update_existing_pricing':
        $data = json_decode($_POST['data'] ?? '[]', true);
        if (empty($data)) {
            echo json_encode(['success' => false, 'error' => 'No data received.']);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE product_pricing 
            SET unit_cost = 0, unit_price = ?, status = ?, date_effective = CURDATE()
            WHERE pricing_id = ? AND user_id = ?
        ");

        foreach ($data as $row) {
            $unit_price = (float)$row['unit_price'];
            $status = (string)$row['status'];
            $pricing_id = (int)$row['pricing_id'];

            $stmt->bind_param("dsii", $unit_price, $status, $pricing_id, $user_id);
            $stmt->execute();
        }

        echo json_encode(['success' => true, 'message' => 'Pricing updated successfully.']);
        break;

    // =======================================================
    // 6️⃣ DELETE PRICING ENTRY
    // =======================================================
    case 'delete_pricing':
        $pricing_id = $_POST['pricing_id'] ?? null;
        if (!$pricing_id) {
            echo json_encode(['success' => false, 'error' => 'Missing pricing_id']);
            exit;
        }

        $delete = $conn->prepare("DELETE FROM product_pricing WHERE pricing_id = ? AND user_id = ?");
        $delete->bind_param("ii", $pricing_id, $user_id);
        $delete->execute();

        echo json_encode(['success' => true, 'message' => 'Pricing deleted successfully.']);
        break;

    // =======================================================
    // ❌ INVALID ACTION
    // =======================================================
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid or missing action.']);
        break;
}

$conn->close();
?>
