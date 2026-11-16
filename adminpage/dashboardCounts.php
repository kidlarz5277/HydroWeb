<?php
header("Content-Type: application/json");

// DATABASE CONNECTION
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hydroweb_db";  // <-- change this to your DB name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}

// 1. PENDING ADMIN USERS
$pendingQuery = "SELECT COUNT(*) AS pendingAdmins FROM users WHERE status = 'Pending'";
$pendingResult = $conn->query($pendingQuery);
$pendingAdmins = $pendingResult->fetch_assoc()['pendingAdmins'];

// 2. CURRENT CONTAINERS (category = 'Containers')
$containerQuery = "SELECT COUNT(*) AS containerCount FROM product WHERE category = 'Containers'";
$containerResult = $conn->query($containerQuery);
$containerCount = $containerResult->fetch_assoc()['containerCount'];

// 3. NEW FEEDBACKS (submitted today)
$feedbackQuery = "SELECT COUNT(*) AS newFeedbacks FROM feedback WHERE DATE(date_submitted) = CURDATE()";
$feedbackResult = $conn->query($feedbackQuery);
$newFeedbacks = $feedbackResult->fetch_assoc()['newFeedbacks'];

// 4. CURRENT WATER TYPES
$waterQuery = "SELECT COUNT(*) AS waterTypes FROM water_type";
$waterResult = $conn->query($waterQuery);
$waterTypes = $waterResult->fetch_assoc()['waterTypes'];

$conn->close();

// RETURN JSON
echo json_encode([
    "pendingAdmins" => $pendingAdmins,
    "containerCount" => $containerCount,
    "newFeedbacks" => $newFeedbacks,
    "waterTypes" => $waterTypes
]);
?>
