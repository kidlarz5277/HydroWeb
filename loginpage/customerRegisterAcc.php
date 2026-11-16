<?php
session_start();

// Database connection
$servername = "localhost";
$username = "root"; // default for XAMPP
$password = ""; // default for XAMPP
$dbname = "hydroweb_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Sanitize and validate form inputs
$full_name        = trim($_POST['fullname'] ?? '');
$contact_no       = trim($_POST['contactno'] ?? '');
$home_address     = trim($_POST['customer_address'] ?? '');
$user_name        = trim($_POST['username'] ?? '');
$password         = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// Validate required fields
if (empty($full_name) || empty($contact_no) || empty($home_address) || empty($user_name) || empty($password) || empty($confirm_password)) {
    echo "<script>alert('Please fill in all required fields.'); window.history.back();</script>";
    exit;
}

// Validate password match
if ($password !== $confirm_password) {
    echo "<script>alert('Passwords do not match.'); window.history.back();</script>";
    exit;
}

// Check for duplicate username
$checkUser = $conn->prepare("SELECT customer_id FROM customers WHERE user_name = ?");
$checkUser->bind_param("s", $user_name);
$checkUser->execute();
$checkUser->store_result();

if ($checkUser->num_rows > 0) {
    echo "<script>alert('Username already exists. Please choose another.'); window.history.back();</script>";
    $checkUser->close();
    $conn->close();
    exit;
}
$checkUser->close();

// Hash the password securely
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert the user into the database (email removed)
$stmt = $conn->prepare("
    INSERT INTO customers (full_name, contact_no, home_address, user_name, password)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->bind_param("sssss", $full_name, $contact_no, $home_address, $user_name, $hashed_password);

// Execute and check result
if ($stmt->execute()) {
    echo "<script>
            alert('Registration successful! You can now log in.');
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
