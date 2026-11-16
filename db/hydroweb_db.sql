-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 07, 2025 at 05:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hydroweb_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int(10) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `user_name` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `date_registered` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `full_name`, `user_name`, `password`, `date_registered`) VALUES
(4, 'Hansam Creator', 'admin123', '$2y$10$/KarFA8qDg.Oj.MhsfMvSOEQJsRxP4BHyN0.OH4Vu9vWb.qhil3aa', '2025-10-08 16:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `contact_no` varchar(20) NOT NULL,
  `home_address` varchar(255) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_registered` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `full_name`, `contact_no`, `home_address`, `user_name`, `password`, `date_registered`) VALUES
(1, 'Lars Manayaga', '09267949764', 'Purok 3, Lower Jasaan', 'kidlarz', '$2y$10$8apZ8S6RITOxvseA6vkOlOvJz59l8KSE0b8taRml67rgABe9KRrGW', '2025-10-10 06:12:59'),
(2, 'Lyka Manayaga', '09924784263', 'Purok 3, Solana, Jasaan, Misamis Oriental', 'lyka', '$2y$10$.Hbnj8vUOTZuYKirLvB7POmmIQ5f5emRXQ0/qaSvpxkvWVQpEv3Vq', '2025-11-15 05:51:18'),
(3, 'Diosdado Bastida', '09924784263', 'Kimaya, Jasaan, Misamis Oriental', 'dio', '$2y$10$FxsfZF5d14ER3v9Yw.LBG.O4gMAv6VH7P6oQhu0mC5kA8iVhIjS8O', '2025-11-15 06:50:44'),
(5, 'Hansam Creator', '09354924294', 'Purok 3, Lower Jasaan', 'hansam', '$2y$10$EUrn9.rbZ2UpP8a7vnAzbuhMWg64sjRqKQJd.gRCKYYnKfsfSNTgG', '2025-12-06 15:49:25');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_item`
--

CREATE TABLE `delivery_item` (
  `delivery_item_id` int(11) NOT NULL,
  `delivery_id` int(11) NOT NULL,
  `pricing_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `status` enum('Pending','Delivered','To Confirm','Cancelled') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_item`
--

INSERT INTO `delivery_item` (`delivery_item_id`, `delivery_id`, `pricing_id`, `quantity`, `status`) VALUES
(19, 17, 106, 4, 'Delivered'),
(20, 17, 88, 4, 'Delivered'),
(21, 18, 102, 2, 'Delivered'),
(22, 19, 89, 10, 'Delivered'),
(26, 27, 106, 40, 'Delivered'),
(27, 28, 106, 40, 'Delivered'),
(30, 31, 100, 1, 'Delivered'),
(31, 55, 89, 1, 'Delivered'),
(32, 56, 100, 1, 'Delivered'),
(33, 57, 100, 1, 'Cancelled'),
(34, 58, 100, 1, 'Delivered'),
(38, 62, 89, 1, 'Cancelled'),
(40, 64, 100, 1, 'Cancelled'),
(41, 65, 100, 1, 'Cancelled'),
(42, 66, 100, 1, 'Cancelled'),
(43, 67, 100, 1, 'Delivered'),
(44, 68, 100, 1, 'Delivered'),
(45, 69, 100, 1, 'Cancelled'),
(46, 70, 99, 1, 'Cancelled'),
(47, 79, 100, 2, 'Cancelled');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_pricing`
--

CREATE TABLE `delivery_pricing` (
  `deliveryprice_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `area_name` varchar(100) NOT NULL,
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_pricing`
--

INSERT INTO `delivery_pricing` (`deliveryprice_id`, `user_id`, `area_name`, `delivery_fee`, `created_at`, `updated_at`) VALUES
(7, 3, 'Solana', 40.00, '2025-10-30 03:45:54', '2025-11-03 03:19:21'),
(8, 4, 'jasaan', 5.00, '2025-12-05 23:13:43', '2025-12-05 23:13:43');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_sales`
--

CREATE TABLE `delivery_sales` (
  `delivery_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `deliveryprice_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Pending','Delivered','To Confirm','Cancelled') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `preferred_date` datetime DEFAULT NULL COMMENT 'Customer preferred delivery datetime',
  `delivered_at` datetime DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_sales`
--

INSERT INTO `delivery_sales` (`delivery_id`, `user_id`, `full_name`, `address`, `phone_number`, `deliveryprice_id`, `total_amount`, `status`, `created_at`, `preferred_date`, `delivered_at`, `customer_id`) VALUES
(17, 3, 'zle', 'solana', '09924784263', 7, 608.00, 'Delivered', '2025-11-24 22:24:33', NULL, '2025-12-02 04:19:55', NULL),
(18, 3, 'Lars', 'Solana', '12345678910', 7, 4.00, 'Delivered', '2025-12-02 03:19:19', NULL, '2025-12-02 04:19:51', NULL),
(19, 3, 'lars', 'solana', '12345678910', 7, 1200.00, 'Delivered', '2025-12-02 03:30:01', NULL, '2025-12-02 11:32:37', NULL),
(27, 3, 'dddddd', 'solana', '12345678900', 7, 920.00, 'Delivered', '2025-12-04 15:17:01', NULL, '2025-12-04 23:26:58', NULL),
(28, 3, 'ddddd', 'solana', '12345678901', 7, 920.00, 'Delivered', '2025-12-04 15:36:38', NULL, '2025-12-04 23:36:49', NULL),
(31, 4, NULL, NULL, NULL, 8, 20.00, 'Delivered', '2025-12-05 23:56:22', NULL, '2025-12-06 07:57:02', 2),
(55, 3, NULL, NULL, NULL, 7, 160.00, 'Delivered', '2025-12-06 00:04:17', NULL, '2025-12-06 08:07:07', 2),
(56, 4, NULL, NULL, NULL, 8, 25.00, 'Delivered', '2025-12-06 00:10:49', NULL, '2025-12-06 08:11:07', 2),
(57, 4, 'ddddd', 'lower jasaan', '123458900', 8, 25.00, 'Cancelled', '2025-12-06 00:21:11', NULL, NULL, NULL),
(58, 4, NULL, NULL, NULL, 8, 25.00, 'Delivered', '2025-12-06 00:33:57', NULL, '2025-12-06 08:34:34', 2),
(62, 3, 'larsy', 'solana', '09924784263', 7, 160.00, 'Cancelled', '2025-12-06 23:14:17', NULL, NULL, NULL),
(64, 4, NULL, NULL, NULL, 8, 25.00, 'Cancelled', '2025-12-06 23:28:43', NULL, NULL, 2),
(65, 4, 'lars', 'jasaan', '09924784263', 8, 25.00, 'Cancelled', '2025-12-06 23:43:35', NULL, NULL, NULL),
(66, 4, NULL, NULL, NULL, 8, 25.00, 'Cancelled', '2025-12-06 23:45:17', NULL, NULL, 2),
(67, 4, 'lyka', 'jasaan', '09354924294', 8, 25.00, 'Delivered', '2025-12-07 00:11:38', NULL, '2025-12-07 08:11:56', NULL),
(68, 4, NULL, NULL, NULL, 8, 25.00, 'Delivered', '2025-12-07 00:12:35', NULL, '2025-12-07 08:13:21', 2),
(69, 4, NULL, NULL, NULL, 8, 25.00, 'Cancelled', '2025-12-07 00:26:28', NULL, NULL, 2),
(70, 3, NULL, NULL, NULL, 7, 62.00, 'Cancelled', '2025-12-07 00:40:45', NULL, NULL, 2),
(78, 4, NULL, NULL, NULL, 8, 0.00, 'Cancelled', '2025-12-07 04:12:24', NULL, NULL, 2),
(79, 4, NULL, NULL, NULL, 8, 50.00, 'Cancelled', '2025-12-07 04:12:30', NULL, NULL, 2);

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `date_submitted` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feedback`
--

INSERT INTO `feedback` (`feedback_id`, `message`, `date_submitted`, `user_id`) VALUES
(1, 'Great System', '2025-10-09 12:52:41', 3),
(2, 'WTF this system is good', '2025-10-09 12:53:10', 3),
(7, 'nice', '2025-10-10 01:43:01', 7),
(8, 'warawrwq', '2025-10-10 03:19:19', 4),
(9, 'asdasdada', '2025-10-16 14:18:34', 4),
(10, 'wdwdw', '2025-11-02 15:26:45', 3),
(11, 'ueufuef', '2025-11-02 15:27:14', 3),
(12, 'lars', '2025-11-02 15:27:37', 3),
(13, 'manayaga', '2025-11-02 15:28:02', 3),
(15, 'dawdawdawd', '2025-11-17 13:23:04', 4);

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `user_id`, `product_id`, `quantity`, `last_updated`) VALUES
(9, 3, 4, 0, '2025-12-01 20:19:55'),
(10, 3, 5, 77, '2025-12-05 17:07:07'),
(11, 3, 8, 0, '2025-12-02 03:12:05'),
(12, 3, 9, 0, '2025-12-01 20:19:51');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `delivery_id` int(11) DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `status` enum('Cancelled','Delivered','Confirmed') DEFAULT 'Confirmed',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `customer_id`, `delivery_id`, `message`, `status`, `is_read`, `created_at`, `updated_at`) VALUES
(1, NULL, 65, 'Your request order has been cancelled', 'Cancelled', 0, '2025-12-06 23:44:09', '2025-12-06 23:44:09'),
(2, 2, 66, 'Your request order has been cancelled', 'Cancelled', 0, '2025-12-06 23:45:48', '2025-12-06 23:45:48'),
(3, NULL, 67, 'Your order has been delivered', 'Delivered', 0, '2025-12-07 00:11:56', '2025-12-07 00:11:56'),
(4, 2, 68, 'Your request order has been confirmed by Refill for Zle', 'Confirmed', 0, '2025-12-07 00:12:59', '2025-12-07 00:12:59'),
(5, 2, 68, 'Your order has been delivered', 'Delivered', 0, '2025-12-07 00:13:21', '2025-12-07 00:13:21'),
(6, 2, 69, 'Your request order has been cancelled', 'Cancelled', 0, '2025-12-07 00:26:52', '2025-12-07 00:26:52'),
(7, 2, 79, 'Your request order has been confirmed by Refill for Zle', 'Confirmed', 0, '2025-12-07 04:31:36', '2025-12-07 04:31:36'),
(8, 2, 79, 'Your request order has been cancelled', 'Cancelled', 0, '2025-12-07 04:33:12', '2025-12-07 04:33:12');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `description`, `category`) VALUES
(4, '25L Container', '25-liter water container for commercial or bulk water usage.', 'Containers'),
(5, '20L Container', '20-liter water container for refilling and delivery use.', 'Containers'),
(6, '10L Container', '10-liter water container for household and small-scale use.', 'Containers'),
(7, '5L Container', '5-liter water container suitable for daily drinking water needs.', 'Containers'),
(8, 'Caps', 'Plastic caps used for water container sealing.', 'Others'),
(9, 'White Tips', 'White dispenser tips used for water containers.', 'Others'),
(10, 'Seal', 'Protective seal to ensure water container safety.', 'Others');

-- --------------------------------------------------------

--
-- Table structure for table `product_pricing`
--

CREATE TABLE `product_pricing` (
  `pricing_id` int(11) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `date_effective` date NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `user_id` int(10) NOT NULL,
  `watervariant_id` int(11) DEFAULT NULL,
  `status` enum('Available','Not Available') NOT NULL DEFAULT 'Not Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_pricing`
--

INSERT INTO `product_pricing` (`pricing_id`, `unit_cost`, `unit_price`, `date_effective`, `product_id`, `user_id`, `watervariant_id`, `status`) VALUES
(88, 50.00, 130.00, '2025-11-11', 4, 3, NULL, 'Available'),
(89, 40.00, 120.00, '2025-11-11', 5, 3, NULL, 'Available'),
(90, 0.00, 0.00, '2025-11-11', 6, 3, NULL, 'Not Available'),
(99, 0.00, 22.00, '2025-11-07', NULL, 3, 8, 'Available'),
(100, 0.00, 20.00, '2025-11-04', NULL, 4, 8, 'Available'),
(101, 2.00, 5.00, '2025-11-03', 8, 3, NULL, 'Available'),
(102, 1.00, 2.00, '2025-11-03', 9, 3, NULL, 'Available'),
(103, 0.00, 0.00, '2025-11-03', 10, 3, NULL, 'Not Available'),
(104, 0.00, 0.00, '2025-11-11', 7, 3, NULL, 'Not Available'),
(105, 0.00, 20.00, '2025-11-07', NULL, 3, 9, 'Available'),
(106, 0.00, 22.00, '2025-11-11', NULL, 3, 10, 'Available'),
(107, 0.00, 25.00, '2025-11-11', NULL, 3, 11, 'Available'),
(108, 0.00, 20.00, '2025-12-05', NULL, 9, 8, 'Available');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `sale_id` int(11) NOT NULL,
  `sale_date` datetime NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`sale_id`, `sale_date`, `total_amount`, `user_id`) VALUES
(19, '2025-11-17 00:00:00', 120.00, 3),
(27, '2025-11-17 00:00:00', 88.00, 3),
(28, '2025-11-17 00:00:00', 11880.00, 3),
(29, '2025-12-02 00:00:00', 1440.00, 3),
(30, '2025-12-04 00:00:00', 880.00, 3),
(31, '2025-12-04 00:00:00', 880.00, 3),
(32, '2025-12-04 00:00:00', 880.00, 3),
(33, '2025-12-04 00:00:00', 880.00, 3),
(34, '2025-12-04 00:00:00', 880.00, 3),
(35, '2025-12-04 23:43:33', 880.00, 3),
(36, '2025-12-04 23:47:14', 88.00, 3),
(37, '2025-12-04 23:49:08', 88.00, 3),
(38, '2025-12-04 23:50:17', 88.00, 3),
(39, '2025-12-05 00:47:29', 800.00, 4),
(40, '2025-12-05 00:53:14', 800.00, 9),
(41, '2025-12-05 14:37:12', 800.00, 9),
(42, '2025-12-05 14:37:51', 800.00, 9),
(43, '2025-12-05 14:43:52', 800.00, 9),
(44, '2025-12-05 14:45:21', 800.00, 9);

-- --------------------------------------------------------

--
-- Table structure for table `sales_report`
--

CREATE TABLE `sales_report` (
  `report_id` int(11) NOT NULL,
  `total_sales` decimal(12,2) NOT NULL,
  `variance_meter` decimal(12,3) NOT NULL,
  `user_id` int(11) NOT NULL,
  `report_start` datetime NOT NULL,
  `report_end` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_report`
--

INSERT INTO `sales_report` (`report_id`, `total_sales`, `variance_meter`, `user_id`, `report_start`, `report_end`) VALUES
(1, 3524.00, 0.000, 3, '2025-12-01 22:08:04', '2025-12-04 23:13:30'),
(2, 0.00, 1.000, 3, '2025-12-04 23:13:30', '2025-12-04 23:17:13'),
(3, 0.00, 1.000, 3, '2025-12-04 23:17:13', '2025-12-04 23:25:57'),
(4, 0.00, 1.000, 3, '2025-12-04 23:25:57', '2025-12-04 23:27:12'),
(5, 0.00, 1.000, 3, '2025-12-04 23:27:12', '2025-12-04 23:29:20'),
(6, 0.00, 1.000, 3, '2025-12-04 23:29:20', '2025-12-04 23:35:29'),
(7, 880.00, 0.000, 3, '2025-12-04 23:35:29', '2025-12-04 23:36:55'),
(8, 0.00, 1.000, 3, '2025-12-04 23:36:55', '2025-12-04 23:38:53'),
(9, 880.00, 0.000, 3, '2025-12-04 23:38:53', '2025-12-04 23:43:47'),
(10, 0.00, 1.000, 3, '2025-12-04 23:43:47', '2025-12-04 23:46:43'),
(11, 88.00, -0.099, 3, '2025-12-04 23:46:43', '2025-12-04 23:47:43'),
(13, 88.00, 0.000, 3, '2025-12-04 23:49:54', '2025-12-04 23:50:29'),
(14, 800.00, 1.000, 4, '2025-12-05 00:47:12', '2025-12-05 00:47:40'),
(19, 800.00, 0.000, 9, '2025-12-05 14:45:09', '2025-12-05 14:45:29');

-- --------------------------------------------------------

--
-- Table structure for table `sale_item`
--

CREATE TABLE `sale_item` (
  `sale_item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `pricing_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sale_item`
--

INSERT INTO `sale_item` (`sale_item_id`, `quantity`, `sale_id`, `pricing_id`) VALUES
(23, 1, 19, 89),
(26, 4, 27, 106),
(27, 99, 28, 89),
(28, 12, 29, 89),
(29, 40, 30, 106),
(30, 40, 31, 106),
(31, 40, 32, 106),
(32, 40, 33, 106),
(33, 40, 34, 106),
(34, 40, 35, 106),
(35, 4, 36, 106),
(36, 4, 37, 106),
(37, 4, 38, 106),
(38, 40, 39, 100),
(39, 40, 40, 108),
(40, 40, 41, 108),
(41, 40, 42, 108),
(42, 40, 43, 108),
(43, 40, 44, 108);

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `transaction_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `action` enum('in','out') NOT NULL,
  `quantity` int(11) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transactions`
--

INSERT INTO `stock_transactions` (`transaction_id`, `inventory_id`, `action`, `quantity`, `transaction_date`) VALUES
(11, 9, 'in', 12, '2025-11-04 02:30:50'),
(12, 9, 'in', 3, '2025-11-04 02:31:16'),
(13, 10, 'in', 20, '2025-11-04 02:32:14'),
(14, 10, 'in', 10, '2025-11-04 02:34:23'),
(15, 10, 'out', 30, '2025-11-09 03:09:29'),
(16, 10, 'in', 200, '2025-11-11 02:26:36'),
(17, 9, 'out', 5, '2025-11-11 02:49:38'),
(18, 9, 'out', 5, '2025-11-11 02:51:21'),
(19, 10, 'out', 1, '2025-11-17 04:21:27'),
(20, 10, 'out', 99, '2025-11-17 04:39:42'),
(21, 9, 'out', 4, '2025-11-24 22:24:33'),
(22, 11, 'in', 5, '2025-12-01 15:04:55'),
(23, 12, 'in', 2, '2025-12-01 15:05:02'),
(24, 11, 'out', 2, '2025-12-02 03:11:55'),
(25, 11, 'out', 3, '2025-12-02 03:12:05'),
(26, 12, 'out', 2, '2025-12-01 20:19:51'),
(27, 9, 'out', 4, '2025-12-01 20:19:55'),
(28, 10, 'out', 10, '2025-12-01 20:32:37'),
(29, 10, 'out', 12, '2025-12-02 03:33:36'),
(30, 10, 'out', 1, '2025-12-05 17:07:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `user_name` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `contact_no` varchar(100) DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `shop_name` varchar(100) DEFAULT NULL,
  `business_address` varchar(255) NOT NULL,
  `date_registered` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('Pending','Activated','Deactivated') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `user_name`, `email`, `password`, `contact_no`, `opening_time`, `closing_time`, `shop_name`, `business_address`, `date_registered`, `status`) VALUES
(3, 'Paul Valcorza', 'paulex', 'paul@gmail.com', '$2y$10$iK5f.n4nra78Id.EW0BeEOK3CFjAlcGJ8Gi8Z9qo04b5vO0aii4IK', '09354924294', '08:00:00', '23:00:00', 'Aquaquinn', 'Purok 4, Lower Jasaan', '2025-12-01 14:56:11', 'Activated'),
(4, 'Geizle Ellevera', 'eizle', 'eizle@gmail.com', '$2y$10$/9tiNst1jQVxVbUg2ldPSuXkJqVdR0bWjCOQ5l25jEqT4eU36SMwe', '09354924294', '07:00:00', '17:00:00', 'Refill for Zle', 'Purok 4, Bobontugan', '2025-12-01 14:55:43', 'Activated'),
(7, 'Jasper Valcueba', 'ampiival', 'ampi@gmail.com', '$2y$10$RxyHheaiFVQ47cqE.wh3leouRFjONJV1Q.q4.rIunWX2ypSoFepom', '09057018493', NULL, NULL, 'Tubig Refilling Store', 'Lower Jasaan', '2025-11-28 03:03:49', 'Deactivated'),
(8, 'Zildjian Manayaga', 'yanex', 'yan@gmail.com', '$2y$10$nZRdtMONTnk4XJYHyMzAtu54MyIcqLDB8Y7JijNmC/2wHcYX1ceqy', '09267949764', '08:00:00', '18:00:00', 'Water Yanyan', 'Purok 3, Lower Jasaan, Jasaan Misamis Oriental', '2025-11-15 06:14:15', 'Pending'),
(9, 'Zild Manayaga', 'zildyan', 'zild12@gmail.com', '$2y$10$.q/Tr0RXWQg3JaHDn4rgauRMbYfD5F8prdVBrX8R0Qqgx9yZiNPOO', '12345678900', '08:00:00', '05:00:00', 'ZILD', 'Lower Jasaan', '2025-12-04 16:52:14', 'Activated');

-- --------------------------------------------------------

--
-- Table structure for table `water_meter`
--

CREATE TABLE `water_meter` (
  `meter_id` int(11) NOT NULL,
  `reading_value` decimal(10,2) DEFAULT NULL,
  `reading_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_meter`
--

INSERT INTO `water_meter` (`meter_id`, `reading_value`, `reading_date`, `user_id`) VALUES
(1, 1.00, '2025-12-01 14:07:01', 3),
(2, 2.00, '2025-12-01 14:08:04', 3),
(7, 3.00, '2025-12-04 15:13:30', 3),
(8, 4.00, '2025-12-04 15:17:13', 3),
(9, 5.00, '2025-12-04 15:25:57', 3),
(10, 6.00, '2025-12-04 15:27:12', 3),
(11, 7.00, '2025-12-04 15:29:20', 3),
(12, 8.00, '2025-12-04 15:35:29', 3),
(13, 9.00, '2025-12-04 15:36:55', 3),
(14, 10.00, '2025-12-04 15:38:53', 3),
(15, 11.00, '2025-12-04 15:43:47', 3),
(16, 12.00, '2025-12-04 15:46:43', 3),
(17, 12.00, '2025-12-04 15:47:43', 3),
(18, 13.00, '2025-12-04 15:49:54', 3),
(19, 13.10, '2025-12-04 15:50:29', 3),
(20, 1.00, '2025-12-04 16:47:12', 4),
(21, 2.00, '2025-12-04 16:47:40', 4),
(29, 1.00, '2025-12-05 06:45:09', 9),
(30, 2.00, '2025-12-05 06:45:29', 9);

-- --------------------------------------------------------

--
-- Table structure for table `water_reserve`
--

CREATE TABLE `water_reserve` (
  `reserve_id` int(11) NOT NULL,
  `watervariant_id` int(11) NOT NULL,
  `user_id` int(10) NOT NULL,
  `quantity_liters` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reserved_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_reserve`
--

INSERT INTO `water_reserve` (`reserve_id`, `watervariant_id`, `user_id`, `quantity_liters`, `reserved_at`) VALUES
(2, 9, 3, 4000.00, '2025-11-11 10:51:00'),
(3, 10, 3, 0.00, '2025-11-11 11:40:10');

-- --------------------------------------------------------

--
-- Table structure for table `water_size`
--

CREATE TABLE `water_size` (
  `watersize_id` int(11) NOT NULL,
  `size_label` varchar(50) NOT NULL,
  `volume_liters` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_size`
--

INSERT INTO `water_size` (`watersize_id`, `size_label`, `volume_liters`) VALUES
(1, '25L', 25.00),
(2, '20L', 20.00),
(3, '10L', 10.00),
(4, '5L', 5.00);

-- --------------------------------------------------------

--
-- Table structure for table `water_transaction`
--

CREATE TABLE `water_transaction` (
  `transaction_id` int(11) NOT NULL,
  `reserve_id` int(10) NOT NULL,
  `action` enum('IN','OUT') NOT NULL,
  `quantity_liters` decimal(10,2) NOT NULL,
  `transaction_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_transaction`
--

INSERT INTO `water_transaction` (`transaction_id`, `reserve_id`, `action`, `quantity_liters`, `transaction_date`) VALUES
(3, 2, 'IN', 1000.00, '2025-11-10 21:21:53'),
(4, 2, 'IN', 100.00, '2025-11-10 21:22:17'),
(5, 2, 'IN', 200.00, '2025-11-11 10:22:46'),
(6, 2, 'IN', 200.00, '2025-11-11 10:25:28'),
(7, 2, 'IN', 500.00, '2025-11-11 10:26:03'),
(8, 2, 'IN', 2000.00, '2025-11-11 10:51:00'),
(9, 3, 'IN', 2000.00, '2025-11-11 11:40:10'),
(10, 3, 'OUT', 100.00, '2025-11-17 12:39:13'),
(11, 3, 'OUT', 100.00, '2025-11-25 06:24:33'),
(12, 3, 'OUT', 100.00, '2025-12-02 04:19:55'),
(13, 3, 'OUT', 1000.00, '2025-12-04 16:26:58'),
(14, 3, 'OUT', 1000.00, '2025-12-04 16:36:49');

-- --------------------------------------------------------

--
-- Table structure for table `water_type`
--

CREATE TABLE `water_type` (
  `water_id` int(11) NOT NULL,
  `water_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_type`
--

INSERT INTO `water_type` (`water_id`, `water_name`, `description`) VALUES
(1, 'Mineral Water', 'Contains essential minerals'),
(2, 'Distilled Waters', 'Purified for appliances and laboratories'),
(3, 'Alkaline Water', 'Balances body pH levels');

-- --------------------------------------------------------

--
-- Table structure for table `water_variant`
--

CREATE TABLE `water_variant` (
  `watervariant_id` int(11) NOT NULL,
  `water_id` int(11) NOT NULL,
  `watersize_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `water_variant`
--

INSERT INTO `water_variant` (`watervariant_id`, `water_id`, `watersize_id`) VALUES
(8, 1, 1),
(9, 1, 2),
(7, 1, 3),
(10, 2, 1),
(11, 3, 1),
(6, 3, 3),
(5, 3, 4);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `user_name` (`user_name`);

--
-- Indexes for table `delivery_item`
--
ALTER TABLE `delivery_item`
  ADD PRIMARY KEY (`delivery_item_id`),
  ADD KEY `delivery_id` (`delivery_id`),
  ADD KEY `pricing_id` (`pricing_id`);

--
-- Indexes for table `delivery_pricing`
--
ALTER TABLE `delivery_pricing`
  ADD PRIMARY KEY (`deliveryprice_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `delivery_sales`
--
ALTER TABLE `delivery_sales`
  ADD PRIMARY KEY (`delivery_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `deliveryprice_id` (`deliveryprice_id`),
  ADD KEY `fk_customer` (`customer_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `delivery_id` (`delivery_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `product_pricing`
--
ALTER TABLE `product_pricing`
  ADD PRIMARY KEY (`pricing_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_product_pricing_variant` (`watervariant_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`sale_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `sales_report`
--
ALTER TABLE `sales_report`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `sale_item`
--
ALTER TABLE `sale_item`
  ADD PRIMARY KEY (`sale_item_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `pricing_id` (`pricing_id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `water_meter`
--
ALTER TABLE `water_meter`
  ADD PRIMARY KEY (`meter_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `water_reserve`
--
ALTER TABLE `water_reserve`
  ADD PRIMARY KEY (`reserve_id`),
  ADD KEY `fk_water_variant` (`watervariant_id`),
  ADD KEY `fk_user` (`user_id`);

--
-- Indexes for table `water_size`
--
ALTER TABLE `water_size`
  ADD PRIMARY KEY (`watersize_id`);

--
-- Indexes for table `water_transaction`
--
ALTER TABLE `water_transaction`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `fk_transaction_reserve` (`reserve_id`);

--
-- Indexes for table `water_type`
--
ALTER TABLE `water_type`
  ADD PRIMARY KEY (`water_id`);

--
-- Indexes for table `water_variant`
--
ALTER TABLE `water_variant`
  ADD PRIMARY KEY (`watervariant_id`),
  ADD UNIQUE KEY `water_id` (`water_id`,`watersize_id`),
  ADD KEY `watersize_id` (`watersize_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `delivery_item`
--
ALTER TABLE `delivery_item`
  MODIFY `delivery_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `delivery_pricing`
--
ALTER TABLE `delivery_pricing`
  MODIFY `deliveryprice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `delivery_sales`
--
ALTER TABLE `delivery_sales`
  MODIFY `delivery_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `product_pricing`
--
ALTER TABLE `product_pricing`
  MODIFY `pricing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `sales_report`
--
ALTER TABLE `sales_report`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `sale_item`
--
ALTER TABLE `sale_item`
  MODIFY `sale_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `water_meter`
--
ALTER TABLE `water_meter`
  MODIFY `meter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `water_reserve`
--
ALTER TABLE `water_reserve`
  MODIFY `reserve_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `water_size`
--
ALTER TABLE `water_size`
  MODIFY `watersize_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `water_transaction`
--
ALTER TABLE `water_transaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `water_type`
--
ALTER TABLE `water_type`
  MODIFY `water_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `water_variant`
--
ALTER TABLE `water_variant`
  MODIFY `watervariant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `delivery_item`
--
ALTER TABLE `delivery_item`
  ADD CONSTRAINT `delivery_item_ibfk_1` FOREIGN KEY (`delivery_id`) REFERENCES `delivery_sales` (`delivery_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_item_ibfk_2` FOREIGN KEY (`pricing_id`) REFERENCES `product_pricing` (`pricing_id`) ON UPDATE CASCADE;

--
-- Constraints for table `delivery_pricing`
--
ALTER TABLE `delivery_pricing`
  ADD CONSTRAINT `delivery_pricing_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `delivery_sales`
--
ALTER TABLE `delivery_sales`
  ADD CONSTRAINT `delivery_sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_sales_ibfk_2` FOREIGN KEY (`deliveryprice_id`) REFERENCES `delivery_pricing` (`deliveryprice_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`);

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`delivery_id`) REFERENCES `delivery_sales` (`delivery_id`);

--
-- Constraints for table `product_pricing`
--
ALTER TABLE `product_pricing`
  ADD CONSTRAINT `fk_product_pricing_variant` FOREIGN KEY (`watervariant_id`) REFERENCES `water_variant` (`watervariant_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `product_pricing_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_pricing_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `sales_report`
--
ALTER TABLE `sales_report`
  ADD CONSTRAINT `sales_report_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `sale_item`
--
ALTER TABLE `sale_item`
  ADD CONSTRAINT `sale_item_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`),
  ADD CONSTRAINT `sale_item_ibfk_2` FOREIGN KEY (`pricing_id`) REFERENCES `product_pricing` (`pricing_id`);

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `stock_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`);

--
-- Constraints for table `water_meter`
--
ALTER TABLE `water_meter`
  ADD CONSTRAINT `water_meter_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `water_reserve`
--
ALTER TABLE `water_reserve`
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_water_variant` FOREIGN KEY (`watervariant_id`) REFERENCES `water_variant` (`watervariant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `water_transaction`
--
ALTER TABLE `water_transaction`
  ADD CONSTRAINT `fk_transaction_reserve` FOREIGN KEY (`reserve_id`) REFERENCES `water_reserve` (`reserve_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `water_variant`
--
ALTER TABLE `water_variant`
  ADD CONSTRAINT `water_variant_ibfk_1` FOREIGN KEY (`water_id`) REFERENCES `water_type` (`water_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `water_variant_ibfk_2` FOREIGN KEY (`watersize_id`) REFERENCES `water_size` (`watersize_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
