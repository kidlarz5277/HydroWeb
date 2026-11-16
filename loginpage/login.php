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

// Sanitize inputs
$user_name = trim($_POST['username'] ?? '');
$password  = $_POST['password'] ?? '';

// Validate input
if (empty($user_name) || empty($password)) {
    echo "<script>alert('Please enter both username and password.'); window.history.back();</script>";
    exit;
}

// Function to verify login for a given table
function tryLogin($conn, $table, $id_field, $user_name, $password) {
    $stmt = $conn->prepare("SELECT * FROM $table WHERE user_name = ?");
    $stmt->bind_param("s", $user_name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();

        // For 'users' table, check if status is 'Activated'
        if ($table === 'users' && $row['status'] !== 'Activated') {
            echo "<script>alert('Your account is not activated.'); window.history.back();</script>";
            $stmt->close();
            $conn->close();
            exit;
        }

        // Verify password (supports both hashed and plain text)
        if (password_verify($password, $row['password']) || $password === $row['password']) {
            // Set session variables
            $_SESSION['user_id'] = $row[$id_field] ?? null;
            $_SESSION['full_name'] = $row['full_name'];
            $_SESSION['username'] = $row['user_name'];
            $_SESSION['account_type'] = $table;

            // Redirect based on account type
            if ($table === 'admin') {
                echo "<script>
                        alert('Welcome Super Admin, {$row['full_name']}!');
                        window.location.href = '../adminpage/admin.html';
                      </script>";
            } elseif ($table === 'users') {
                echo "<script>
                        alert('Welcome Admin, {$row['full_name']}!');
                        window.location.href = '../homepage/homepage.html';
                      </script>";
            } elseif ($table === 'customers') {
                echo "<script>
                        alert('Welcome Customer, {$row['full_name']}!');
                        window.location.href = '../customerspage/index.html';
                      </script>";
            }

            $stmt->close();
            $conn->close();
            exit;
        }
    }

    $stmt->close();
    return false;
}

// Try login in this order: admin → users → customers
if (!tryLogin($conn, 'admin', 'admin_id', $user_name, $password)) {
    if (!tryLogin($conn, 'users', 'user_id', $user_name, $password)) {
        if (!tryLogin($conn, 'customers', 'customer_id', $user_name, $password)) {
            echo "<script>alert('Invalid username or password.'); window.history.back();</script>";
        }
    }
}

$conn->close();
?>
