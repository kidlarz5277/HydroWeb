<?php
// Enable error reporting for development
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

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Determine HTTP method
$method = $_SERVER['REQUEST_METHOD'];

try {

    if ($method === 'GET') {

        // Fetch all products from correct table
        $result = $conn->query("SELECT * FROM product");
        if (!$result) throw new Exception($conn->error);

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        echo json_encode($products);


    } elseif ($method === 'POST') {

        // Read JSON input
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) throw new Exception("Invalid JSON input");

        // Validate required fields
        $name = isset($data['product_name']) ? trim($data['product_name']) : '';
        $desc = isset($data['description']) ? trim($data['description']) : '';
        $cat  = isset($data['category']) ? trim($data['category']) : '';

        if (!$name || !$desc || !$cat) {
            throw new Exception("All fields are required");
        }

        // Escape strings for SQL
        $name = $conn->real_escape_string($name);
        $desc = $conn->real_escape_string($desc);
        $cat  = $conn->real_escape_string($cat);

        // Insert product into correct table
        $sql = "INSERT INTO product (product_name, description, category) VALUES ('$name', '$desc', '$cat')";
        if ($conn->query($sql) === TRUE) {
            // Return new product_id
            echo json_encode(["status" => "success", "insert_id" => $conn->insert_id]);
        } else {
            throw new Exception($conn->error);
        }


    } elseif ($method === 'DELETE') {

        // DELETE product by product_id
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['product_id'])) {
            throw new Exception("Missing product ID");
        }

        $id = intval($data['product_id']);

        // Use correct column name product_id
        $sql = "DELETE FROM product WHERE product_id = $id";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            throw new Exception($conn->error);
        }

    } elseif ($method === 'PUT') {

        // UPDATE product by product_id
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['product_id'])) {
            throw new Exception("Missing product ID");
        }

        $id = intval($data['product_id']);
        $name = isset($data['product_name']) ? $conn->real_escape_string(trim($data['product_name'])) : '';
        $desc = isset($data['description']) ? $conn->real_escape_string(trim($data['description'])) : '';
        $cat  = isset($data['category']) ? $conn->real_escape_string(trim($data['category'])) : '';

        if (!$name || !$desc || !$cat) {
            throw new Exception("All fields are required");
        }

        $sql = "UPDATE product SET product_name='$name', description='$desc', category='$cat' WHERE product_id=$id";
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

// Close connection
$conn->close();
?>
