<?php
session_start();
header("Content-Type: application/json");

// Only allow logged-in customers
if (!isset($_SESSION['username']) || $_SESSION['account_type'] !== 'customers') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);
$delivery_id = $data["delivery_id"] ?? null;

if (!$delivery_id) {
    echo json_encode(["success" => false, "message" => "Missing delivery ID"]);
    exit;
}

// Database connection
$conn = new mysqli("localhost", "root", "", "hydroweb_db");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

try {
    // Begin transaction
    $conn->begin_transaction();

    // Step 1: Update delivery items status to 'Cancelled'
    $stmt1 = $conn->prepare("UPDATE delivery_item SET status = 'Cancelled' WHERE delivery_id = ?");
    $stmt1->bind_param("i", $delivery_id);
    $stmt1->execute();
    $stmt1->close();

    // Step 2: Update main delivery record status to 'Cancelled'
    $stmt2 = $conn->prepare("UPDATE delivery_sales SET status = 'Cancelled' WHERE delivery_id = ?");
    $stmt2->bind_param("i", $delivery_id);
    $stmt2->execute();
    $stmt2->close();

    // Commit transaction
    $conn->commit();

    echo json_encode(["success" => true, "message" => "Delivery cancelled successfully"]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Failed to cancel delivery: " . $e->getMessage()]);
}

$conn->close();
?>
