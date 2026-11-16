<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "hydroweb_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Fetch station + delivery areas
$query = "
    SELECT 
        u.user_id,
        u.full_name,
        u.shop_name,
        u.contact_no,
        u.opening_time,
        u.closing_time,
        u.business_address,
        GROUP_CONCAT(dp.area_name ORDER BY dp.area_name SEPARATOR ', ') AS delivery_areas
    FROM users u
    LEFT JOIN delivery_pricing dp ON dp.user_id = u.user_id
    WHERE u.status = 'Activated'
    GROUP BY u.user_id
";

$result = $conn->query($query);

$stations = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $stations[] = $row;
    }
}

echo json_encode($stations);
$conn->close();
?>
