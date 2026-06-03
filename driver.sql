-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.45 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for conveydb
CREATE DATABASE IF NOT EXISTS `conveydb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `conveydb`;

-- Dumping structure for table conveydb.driver_status_tbl
CREATE TABLE IF NOT EXISTS `driver_status_tbl` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reg_id` varchar(20) NOT NULL,
  `dId` int NOT NULL,
  `phNo` varchar(10) NOT NULL,
  `Status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `dId` (`dId`),
  CONSTRAINT `driver_status_tbl_ibfk_1` FOREIGN KEY (`dId`) REFERENCES `driver_tbl` (`dId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table conveydb.driver_status_tbl: ~44 rows (approximately)
INSERT INTO `driver_status_tbl` (`id`, `reg_id`, `dId`, `phNo`, `Status`) VALUES
	(51, 'REG_246CB7E9', 72, '8745963214', 'Active'),
	(52, 'REG_92DFB55F', 73, '9966332587', 'Active'),
	(53, 'REG_246CB7E9', 74, '8745123654', 'Active'),
	(54, 'REG_1BF9F291', 75, '8745123654', 'Active'),
	(55, 'REG_35982592', 76, '8745123654', 'Active'),
	(56, 'REG_EE64DA39', 77, '9858585888', 'Active'),
	(57, 'REG_246CB7E9', 78, '8745125887', 'Active'),
	(58, 'REG_E61330BD', 79, '8585741244', 'Active'),
	(59, 'REG_10B40AD4', 80, '8778578787', 'Active'),
	(60, 'REG_7B1369FA', 81, '9476061421', 'Active'),
	(61, 'REG_C6C72E16', 82, '0099999999', 'Active'),
	(62, 'REG_7A40CC0B', 83, '8745444444', 'Active'),
	(63, 'REG_15249EE9', 84, '8745477878', 'Active'),
	(64, 'REG_E42D7A93', 85, '8754578787', 'Active'),
	(65, 'REG_C6C72E16', 86, '9999999999', 'Active'),
	(66, 'REG_109A7C15', 87, '9933244696', 'Active'),
	(67, 'REG_109A7C15', 88, '3132123232', 'Active'),
	(68, 'REG_F69ED981', 89, '2121212121', 'Active'),
	(69, 'REG_109A7C15', 90, '5874857878', 'Active'),
	(70, 'REG_109A7C15', 91, '6646467879', 'Active'),
	(71, 'REG_8CA12CAD', 92, '4444444444', 'Active'),
	(72, 'REG_01304B75', 93, '0123456789', 'Active'),
	(73, 'REG_01304B75', 94, '1234567890', 'Active'),
	(74, 'REG_01304B75', 95, '1234567890', 'Active'),
	(75, 'REG_01304B75', 96, '2356901847', 'Active'),
	(76, 'REG_4F0D6C1C', 97, '6390251487', 'Active'),
	(77, 'REG_4F0D6C1C', 98, '3062591487', 'Active'),
	(78, 'REG_246CB7E9', 99, '5169874323', 'Active'),
	(79, 'REG_10B40AD4', 100, '5254484448', 'Active'),
	(80, 'REG_1C318C93', 101, '6554555454', 'Active'),
	(81, 'REG_1C318C93', 102, '5465145554', 'Active'),
	(82, 'REG_246CB7E9', 103, '4434323232', 'Active'),
	(83, 'REG_4AADB045', 104, '5546549845', 'Active'),
	(84, 'REG_4E406639', 107, '4545455454', 'Active'),
	(85, 'REG_4E406639', 108, '7865656565', 'Active'),
	(86, 'REG_BBC1BCD8', 109, '5544547454', 'Active'),
	(87, 'REG_BBC1BCD8', 110, '5845455454', 'Active'),
	(88, 'REG_3A005D8F', 111, '5415454545', 'Active'),
	(89, 'REG_EE64DA39', 112, '5645645648', 'Active'),
	(92, 'REG_10B40AD4', 115, '7884524854', 'Active'),
	(93, 'REG_10B40AD4', 116, '5544545345', 'Active'),
	(94, 'REG_F113A3C2', 117, '8787878787', 'Active'),
	(95, 'REG_3A005D8F', 118, '4654658484', 'Active'),
	(96, 'REG_246CB7E9', 119, '7744112585', 'Active');

-- Dumping structure for table conveydb.driver_tbl
CREATE TABLE IF NOT EXISTS `driver_tbl` (
  `dId` int NOT NULL AUTO_INCREMENT,
  `licenseNo` varchar(50) NOT NULL,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `dFirstName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `dLastName` varchar(255) NOT NULL,
  `son_of` varchar(255) NOT NULL,
  `gender` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone_no` varchar(15) NOT NULL,
  `residence_of` text NOT NULL,
  `dStatus` varchar(50) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`dId`),
  UNIQUE KEY `licenseNo` (`licenseNo`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table conveydb.driver_tbl: ~44 rows (approximately)
INSERT INTO `driver_tbl` (`dId`, `licenseNo`, `title`, `dFirstName`, `dLastName`, `son_of`, `gender`, `phone_no`, `residence_of`, `dStatus`) VALUES
	(72, '5412589635', 'Mr', 'AMAL', 'AMAL', '', 'Male', '', '', 'active'),
	(73, '464648484884', 'Mr', 'Amal', 'MV', '', 'Male', '', '', 'active'),
	(74, '99888745125', 'Mr', 'AMAL', 'Kmar', '', 'Male', '', '', 'inactive'),
	(75, '1225478965', 'Mr', 'RAju ', 'bhai', '', 'Male', '', '', 'active'),
	(76, '12124574', 'Mr', 'Kumar ', 'Rao', '', 'Male', '', '', 'active'),
	(77, 'AN0122255555', 'Mr', 'Govt', 'Test', '', 'Male', '', '', 'active'),
	(78, '87877GHHHHHH', 'Mr', 'TEST', 'kumar', '', 'Male', '', '', 'active'),
	(79, '858585857474', 'Mr', 'Rohan', 'Kumar', '', 'Male', '', '', 'active'),
	(80, '878787878787', 'Mr', 'test', 'test', '', 'Male', '', '', 'active'),
	(81, '133863313', 'Mr', 'Test', 'Test', '', 'Male', '', '', 'active'),
	(82, '858574145454', 'Mr', 'Paramjeet ', 'Singh', '', 'Male', '', '', 'active'),
	(83, '858744874787', 'Mr', 'Rahu ', 'Ram', '', 'Male', '', '', 'active'),
	(84, '852144444447', 'Mr', 'Shup', 'sham', '', 'Male', '', '', 'active'),
	(85, '858585888888', 'Mr', 'Raju', 'Kumar', '', 'Male', '', '', 'active'),
	(86, '484854166565', 'Mr', 'Raju', 'Bhai', '', 'Male', '', '', 'active'),
	(87, '212148876969', 'Mr', 'G', 'Krishna', '', 'Male', '', '', 'active'),
	(88, '213213232323', 'Mr', 'Gopi', 'G', '', 'Male', '', '', 'active'),
	(89, '465465465656', 'Mr', 'Munna', 'Bhaiya', '', 'Male', '', '', 'active'),
	(90, '645645485787', 'Mr', 'Yadav', 'Kumar', '', 'Male', '', '', 'active'),
	(91, '547545787899', 'Mr', 'Rahul', 'Sharma', '', 'Male', '', '', 'active'),
	(92, '885858555555', 'Mr', 'Navin ', 'kumar', '', 'Male', '', '', 'active'),
	(93, 'LISCENCE0011', 'Mr', 'S', 'Kumar', '', 'Male', '', '', 'active'),
	(94, 'LISCENCE0012', 'Mr', 'L', 'Kumar', '', 'Male', '', '', 'inactive'),
	(95, 'ALK098764533', 'Mr', 'L', 'Kumar', '', 'Male', '', '', 'active'),
	(96, 'KANA90876543', 'Mrs', 'Y', 'M', '', 'Female', '', '', 'active'),
	(97, 'MIND22233344', 'Ms', 'Z', 'Joe', '', 'Female', '', '', 'active'),
	(98, 'JCKR01010101', 'Mrs', 'G', 'Lane', '', 'Female', '', '', 'active'),
	(99, 'AN0120182025', 'Mr', 'Subash', 'V', '', 'Male', '', '', 'active'),
	(100, 'AN0120165544', 'Mr', 'Meghanathan', 'Rao', '', 'Male', '', '', 'active'),
	(101, 'AN0119995548', 'Mr', 'Shivam', 'Kumar', '', 'Male', '', '', 'active'),
	(102, 'AN0120001546', 'Mr', 'Kumar', 'Sanu', '', 'Male', '', '', 'active'),
	(103, 'DSDSDSDSDS', 'Mr', 'sddsd', 'sdsd', 'sdsdsd', 'Male', '4434323232', '32322323', 'active'),
	(104, '5656FTYFTYFC', 'Mr', 'Joe', 'Bden', 'SHam', 'Male', '5546549845', 'test', 'active'),
	(107, '545448898877', 'Mr', 'subash', 'rao', 'vishwanathan', 'Male', '4545455454', 'test', 'active'),
	(108, 'AN0119976425', 'Ms', 'Viswaw', 'Rao', 'dinesh', 'Male', '7865656565', 'test', 'active'),
	(109, '545455454545', 'Mr', 'sham', 'raio', 'singh', 'Male', '5544547454', 'tyest', 'active'),
	(110, '454545454545', 'Ms', 'sigh', 'rai', 'Bgar', 'Male', '5845455454', 'test', 'active'),
	(111, 'AN0165436256', 'Mr', 'Nathin ', 'Jamesh', 'James', 'Male', '5415454545', 'test', 'active'),
	(112, 'AN01201300003600', 'Mr', 'rahul', 'pratap', 'pratap', 'Male', '5645645648', 'test', 'active'),
	(115, 'FDFDFDFDFDF', 'Mr', 'rfgrdfgd', 'gdfgdfg', 'dgdfgdf', 'Male', '7884524854', 'DROP TABLE users;', 'active'),
	(116, '54545453RFTER54GVT4', 'Mr', 'rfgdggfdg', 'ffgff', 'ggffgfgfg', 'Male', '5544545345', 'DROP TABLE users;', 'active'),
	(117, '5454145454', 'Mr', 'test', 'test', 'test', 'Male', '8787878787', 'test', 'active'),
	(118, '12454AUJHCUHB', 'Mr', 'kumar', 'rao', 'sham rao', 'Male', '4654658484', 'test address', 'active'),
	(119, 'ANO1KLNKJJHUBBV', 'Mr', 'Ravi', 'Rampaul', 'Rampaul', 'Male', '7744112585', 'test addres', 'active');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
