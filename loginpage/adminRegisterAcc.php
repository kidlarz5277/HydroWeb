<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hydroweb_db";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Sanitize and validate form inputs
$full_name        = trim($_POST['fullname'] ?? '');
$shop_name        = trim($_POST['shopname'] ?? '');
$contact_no       = trim($_POST['contactno'] ?? '');
$business_address = trim($_POST['business_address'] ?? '');
$user_name        = trim($_POST['username'] ?? '');
$email            = trim($_POST['email'] ?? '');
$opening_time_raw = trim($_POST['opening_time'] ?? '');
$closing_time_raw = trim($_POST['closing_time'] ?? '');
$password         = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// Validate required fields
if (
    empty($full_name) || empty($shop_name) || empty($contact_no) ||
    empty($business_address) || empty($user_name) || empty($email) ||
    empty($opening_time_raw) || empty($closing_time_raw) ||
    empty($password) || empty($confirm_password)
) {
    echo "<script>alert('Please fill in all required fields.'); window.history.back();</script>";
    exit;
}

// Validate password match
if ($password !== $confirm_password) {
    echo "<script>alert('Passwords do not match.'); window.history.back();</script>";
    exit;
}

// Convert times (12-hour → 24-hour format automatically)
$opening_time = date("H:i:s", strtotime($opening_time_raw));
$closing_time = date("H:i:s", strtotime($closing_time_raw));

// Check for duplicate username or email
$checkUser = $conn->prepare("SELECT user_id FROM users WHERE user_name = ? OR email = ?");
$checkUser->bind_param("ss", $user_name, $email);
$checkUser->execute();
$checkUser->store_result();

if ($checkUser->num_rows > 0) {
    echo "<script>alert('Username or Email already exists. Please choose another.'); window.history.back();</script>";
    $checkUser->close();
    $conn->close();
    exit;
}
$checkUser->close();

// Hash the password securely
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert the user into the database
$stmt = $conn->prepare("
    INSERT INTO users 
    (full_name, user_name, email, password, contact_no, opening_time, closing_time, shop_name, business_address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
");

$stmt->bind_param(
    "sssssssss",
    $full_name,
    $user_name,
    $email,
    $hashed_password,
    $contact_no,
    $opening_time,
    $closing_time,
    $shop_name,
    $business_address
);

// Execute and check result
if ($stmt->execute()) {
    echo "<script>
            alert('Registration successful! Your account is now pending approval.');
            window.location.href = 'index.html';
          </script>";
} else {
    echo "<script>
            alert('Error during registration: " . addslashes($stmt->error) . "');
            window.history.back();
          </script>";
}

$stmt->close();
$conn->close();
?>
