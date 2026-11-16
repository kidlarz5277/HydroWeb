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
        if (isset($_GET['water_id'])) {
            // Fetch single water type by ID
            $id = intval($_GET['water_id']);
            $result = $conn->query("SELECT * FROM water_type WHERE water_id=$id");
            if (!$result) throw new Exception($conn->error);

            $row = $result->fetch_assoc();
            echo json_encode($row ?: []);
        } else {
            // Fetch all water types
            $result = $conn->query("SELECT * FROM water_type");
            if (!$result) throw new Exception($conn->error);

            $types = [];
            while ($row = $result->fetch_assoc()) {
                $types[] = $row;
            }
            echo json_encode($types);
        }

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) throw new Exception("Invalid JSON input");

        $name = isset($data['water_name']) ? trim($data['water_name']) : '';
        $desc = isset($data['description']) ? trim($data['description']) : '';

        if (!$name) throw new Exception("Water name is required");

        $name = $conn->real_escape_string($name);
        $desc = $conn->real_escape_string($desc);

        $sql = "INSERT INTO water_type (water_name, description) VALUES ('$name', '$desc')";
        if ($conn->query($sql) === TRUE) {
            echo json_encode([
                "status" => "success",
                "insert_id" => $conn->insert_id  // return new water_id
            ]);
        } else {
            throw new Exception($conn->error);
        }

    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = intval($data['water_id'] ?? 0);
        $name = isset($data['water_name']) ? trim($data['water_name']) : '';
        $desc = isset($data['description']) ? trim($data['description']) : '';

        if (!$id || !$name) throw new Exception("Missing water ID or name");

        $name = $conn->real_escape_string($name);
        $desc = $conn->real_escape_string($desc);

        $sql = "UPDATE water_type SET water_name='$name', description='$desc' WHERE water_id=$id";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            throw new Exception($conn->error);
        }

    } elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = intval($data['water_id'] ?? 0);
        if (!$id) throw new Exception("Missing water ID");

        $sql = "DELETE FROM water_type WHERE water_id=$id";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            throw new Exception($conn->error);
        }

    } else {
        throw new Exception("Unsupported HTTP method");
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
