<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hydroweb_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $conn->connect_error
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Fetch all water sizes
        $result = $conn->query("SELECT * FROM water_size");
        if (!$result) throw new Exception($conn->error);

        $sizes = [];
        while ($row = $result->fetch_assoc()) {
            $sizes[] = $row;
        }
        echo json_encode($sizes);

    } elseif ($method === 'POST') {
        // Add new water size
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) throw new Exception("Invalid JSON input");

        $label = isset($data['size_label']) ? trim($data['size_label']) : '';
        $volume = isset($data['volume_liters']) ? trim($data['volume_liters']) : '';

        if (!$label || !$volume) throw new Exception("Both size label and volume are required");

        $label = $conn->real_escape_string($label);
        $volume = $conn->real_escape_string($volume);

        $sql = "INSERT INTO water_size (size_label, volume_liters) VALUES ('$label', '$volume')";
        if ($conn->query($sql) === TRUE) {
            // Return insert_id for JS
            echo json_encode(["status" => "success", "insert_id" => $conn->insert_id]);
        } else {
            throw new Exception($conn->error);
        }

    } elseif ($method === 'PUT') {
        // Edit existing water size
        $data = json_decode(file_get_contents("php://input"), true);
        $id = intval($data['watersize_id'] ?? 0);  // Updated column name
        $label = isset($data['size_label']) ? trim($data['size_label']) : '';
        $volume = isset($data['volume_liters']) ? trim($data['volume_liters']) : '';

        if (!$id || !$label || !$volume) throw new Exception("Missing water ID, label, or volume");

        $label = $conn->real_escape_string($label);
        $volume = $conn->real_escape_string($volume);

        $sql = "UPDATE water_size SET size_label='$label', volume_liters='$volume' WHERE watersize_id=$id"; // Updated column name
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            throw new Exception($conn->error);
        }

    } elseif ($method === 'DELETE') {
        // Delete water size
        $data = json_decode(file_get_contents("php://input"), true);
        $id = intval($data['watersize_id'] ?? 0); // Updated column name
        if (!$id) throw new Exception("Missing water ID");

        $sql = "DELETE FROM water_size WHERE watersize_id=$id"; // Updated column name
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            throw new Exception($conn->error);
        }

    } else {
        throw new Exception("Unsupported HTTP method");
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>
