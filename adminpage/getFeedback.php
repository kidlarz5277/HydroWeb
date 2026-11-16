<?php
$servername = "localhost";
$username = "root"; // default for XAMPP
$password = ""; // no password by default
$dbname = "hydroweb_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_POST['feedback_id'])) {
    $feedback_id = intval($_POST['feedback_id']);
    $sql = "DELETE FROM feedback WHERE feedback_id = $feedback_id";
    if ($conn->query($sql)) {
        echo "success";
    } else {
        echo "error";
    }
}

$sql = "
  SELECT 
    f.feedback_id,
    f.message,
    f.date_submitted,
    u.shop_name
  FROM feedback f
  JOIN users u ON f.user_id = u.user_id
  ORDER BY f.date_submitted DESC
";

$result = $conn->query($sql);

$feedbacks = [];
while ($row = $result->fetch_assoc()) {
    $feedbacks[] = $row;
}

header('Content-Type: application/json');
echo json_encode($feedbacks);

$conn->close();
?>
