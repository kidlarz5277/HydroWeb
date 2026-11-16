<?php
// Enable error reporting during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Always output JSON
header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hydroweb_db";

$conn = new mysqli($servername, $username, $password, $dbname);

// Connection check
if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $conn->connect_error
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    /* ======================================================================
       GET → Fetch users (Shop Name, Address, Status, User ID)
    =======================================================================*/
    if ($method === 'GET') {

        $sql = "SELECT user_id, shop_name, business_address, email, status FROM users";
        $result = $conn->query($sql);

        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode($users);
        exit;
    }

    /* ======================================================================
       POST → Update Status (Activate / Deactivate)
    =======================================================================*/
    elseif ($method === 'POST') {

        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            throw new Exception("Invalid JSON input");
        }

        // Validate input
        if (!isset($data['user_id']) || !isset($data['status'])) {
            throw new Exception("Missing required fields: user_id or status");
        }

        $user_id = intval($data['user_id']);
        $status  = trim($data['status']);

        // Allowed status values
        $allowed = ['Pending', 'Activated', 'Deactivated'];
        if (!in_array($status, $allowed)) {
            throw new Exception("Invalid status value");
        }

        // Prepared statement to update status
        $stmt = $conn->prepare("UPDATE users SET status = ? WHERE user_id = ?");
        if (!$stmt) throw new Exception($conn->error);

        $stmt->bind_param("si", $status, $user_id);

        if (!$stmt->execute()) {
            throw new Exception("Update failed: " . $stmt->error);
        }

        echo json_encode([
            "status" => "success",
            "message" => "User status updated"
        ]);
        exit;
    }

    // Unsupported method
    else {
        throw new Exception("Unsupported HTTP method");
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

// Close connection
$conn->close();
