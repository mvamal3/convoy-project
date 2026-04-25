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

-- Dumping structure for table conveydb.admin
CREATE TABLE IF NOT EXISTS `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role` enum('user','admin','police') NOT NULL DEFAULT 'admin',
  `isadmin` tinyint(1) NOT NULL DEFAULT '1',
  `isActive` tinyint(1) DEFAULT '1',
  `lastLoginAt` datetime DEFAULT NULL,
  `refreshToken` varchar(500) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT (now()),
  `updatedAt` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userid` (`userid`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.approval_relation
CREATE TABLE IF NOT EXISTS `approval_relation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tId` int DEFAULT NULL,
  `oId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.approve_trip
CREATE TABLE IF NOT EXISTS `approve_trip` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tId` varchar(50) NOT NULL DEFAULT '0',
  `arrdate` date DEFAULT NULL,
  `arrtime` time DEFAULT NULL,
  `convey_id` int NOT NULL DEFAULT (0),
  `checkpost_id` int NOT NULL DEFAULT (0),
  `approveby` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `remarks` varchar(50) NOT NULL DEFAULT '0',
  `astatus` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.checkout_control
CREATE TABLE IF NOT EXISTS `checkout_control` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conveyid` int NOT NULL DEFAULT '0',
  `checkpostid` int NOT NULL DEFAULT '0',
  `date` date NOT NULL,
  `starttime` time NOT NULL DEFAULT '00:00:00',
  `closetime` time NOT NULL DEFAULT '00:00:00',
  `status` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.checkout_trip
CREATE TABLE IF NOT EXISTS `checkout_trip` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tId` varchar(100) NOT NULL DEFAULT '0',
  `conveyid` int NOT NULL DEFAULT (0),
  `checkoutdate` date NOT NULL,
  `checkouttime` time NOT NULL,
  `checkpostid` int NOT NULL,
  `remarks` varchar(100) DEFAULT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.convey_control
CREATE TABLE IF NOT EXISTS `convey_control` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conveyid` int NOT NULL DEFAULT '0',
  `checkpostid` int NOT NULL DEFAULT '0',
  `date` date NOT NULL,
  `starttime` time NOT NULL DEFAULT '00:00:00',
  `closetime` time NOT NULL DEFAULT '00:00:00',
  `status` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.districts
CREATE TABLE IF NOT EXISTS `districts` (
  `district_code` int NOT NULL,
  `district_name` varchar(100) NOT NULL,
  PRIMARY KEY (`district_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

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
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

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
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.dummy_trip
CREATE TABLE IF NOT EXISTS `dummy_trip` (
  `tId` int NOT NULL AUTO_INCREMENT,
  `origin` varchar(50) DEFAULT NULL,
  `destination` varchar(50) DEFAULT NULL,
  `entrydatetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.nationality_master
CREATE TABLE IF NOT EXISTS `nationality_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nationality` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nationality` (`nationality`)
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.officer_tbl
CREATE TABLE IF NOT EXISTS `officer_tbl` (
  `oId` int NOT NULL AUTO_INCREMENT,
  `userId` varchar(50) DEFAULT NULL,
  `oName` varchar(50) DEFAULT NULL,
  `empId` varchar(50) DEFAULT NULL,
  `designation` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`oId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.origin_destination
CREATE TABLE IF NOT EXISTS `origin_destination` (
  `id` int NOT NULL AUTO_INCREMENT,
  `location` varchar(50) NOT NULL DEFAULT '0',
  `loc_id` int NOT NULL DEFAULT (0),
  `status` int NOT NULL DEFAULT (0),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.otp
CREATE TABLE IF NOT EXISTS `otp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `otp` int NOT NULL DEFAULT '0',
  `regid` varchar(50) NOT NULL DEFAULT '0',
  `userid` varchar(50) NOT NULL DEFAULT '0',
  `datetime` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `status` int NOT NULL DEFAULT (0),
  PRIMARY KEY (`id`),
  KEY `FK_totp_registration_tbl` (`regid`),
  CONSTRAINT `FK_totp_registration_tbl` FOREIGN KEY (`regid`) REFERENCES `registration_tbl` (`reg_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.passenger_tbl
CREATE TABLE IF NOT EXISTS `passenger_tbl` (
  `pId` int NOT NULL AUTO_INCREMENT,
  `passengerName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `isForeigner` tinyint(1) NOT NULL DEFAULT '0',
  `fatherName` varchar(50) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `visaNumber` varchar(50) DEFAULT NULL,
  `residence` varchar(255) DEFAULT NULL,
  `phoneNo` varchar(50) DEFAULT NULL,
  `gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `docType` varchar(50) DEFAULT NULL,
  `docId` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`pId`)
) ENGINE=InnoDB AUTO_INCREMENT=871 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.policeuser
CREATE TABLE IF NOT EXISTS `policeuser` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `lastLoginAt` datetime DEFAULT NULL,
  `refreshToken` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `status` int NOT NULL DEFAULT (0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.police_registration_tbl
CREATE TABLE IF NOT EXISTS `police_registration_tbl` (
  `reg_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `firstName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `lastName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `emp_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `checkpost` int DEFAULT NULL,
  `contact` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`reg_id`) USING BTREE,
  KEY `userId` (`userId`) USING BTREE,
  CONSTRAINT `registration_tbl_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `policeuser` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.registration_tbl
CREATE TABLE IF NOT EXISTS `registration_tbl` (
  `reg_id` varchar(20) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `firstName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `orgName` varchar(255) DEFAULT NULL,
  `deptSubCat` varchar(255) DEFAULT NULL,
  `deptName` varchar(255) DEFAULT NULL,
  `docId` varchar(100) DEFAULT NULL,
  `docIdtype` varchar(100) DEFAULT NULL,
  `ownContact` varchar(20) NOT NULL,
  `ownAddress` text NOT NULL,
  `village_code` int DEFAULT NULL,
  `subdistrict_code` int DEFAULT NULL,
  `district_code` int DEFAULT NULL,
  `isOrg` int unsigned NOT NULL DEFAULT '0',
  `status` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`reg_id`),
  KEY `userId` (`userId`),
  CONSTRAINT `FK_registration_tbl_users` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.states
CREATE TABLE IF NOT EXISTS `states` (
  `state_code` int NOT NULL,
  `state_name` varchar(100) NOT NULL,
  `status` tinyint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`state_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.subdistricts
CREATE TABLE IF NOT EXISTS `subdistricts` (
  `subdistrict_code` int NOT NULL AUTO_INCREMENT,
  `district_code` int NOT NULL,
  `subdistrict_name` varchar(225) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`subdistrict_code`) USING BTREE,
  KEY `District_id` (`district_code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.tconvey
CREATE TABLE IF NOT EXISTS `tconvey` (
  `id` int NOT NULL AUTO_INCREMENT,
  `convey_time` time NOT NULL DEFAULT '00:00:00',
  `convey_name` varchar(50) NOT NULL DEFAULT '0',
  `loc_id` int NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.tdesignation
CREATE TABLE IF NOT EXISTS `tdesignation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `designation` varchar(50) NOT NULL DEFAULT '0',
  `value` varchar(50) NOT NULL DEFAULT '0',
  `status` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.trip_relation_tbl
CREATE TABLE IF NOT EXISTS `trip_relation_tbl` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tId` varchar(50) DEFAULT NULL,
  `pId` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=853 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.trip_tbl
CREATE TABLE IF NOT EXISTS `trip_tbl` (
  `tId` varchar(50) NOT NULL DEFAULT '',
  `reg_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `vId` varchar(50) DEFAULT NULL,
  `dId` varchar(50) DEFAULT NULL,
  `origin` int DEFAULT NULL,
  `destination` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `convoyTime` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `entrydatetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verifiystatus` int DEFAULT NULL,
  `isTourist` tinyint(1) NOT NULL DEFAULT '0',
  `verifiedtime` time DEFAULT NULL,
  PRIMARY KEY (`tId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','police','scs') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'user',
  `isActive` tinyint(1) DEFAULT '1',
  `lastLoginAt` datetime DEFAULT NULL,
  `refreshToken` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.vehicle
CREATE TABLE IF NOT EXISTS `vehicle` (
  `vId` int NOT NULL AUTO_INCREMENT,
  `vOwnName` varchar(100) DEFAULT NULL,
  `vNum` varchar(20) NOT NULL,
  `vCat` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `otherCat` varchar(50) DEFAULT NULL,
  `vPurpose` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `otherPurpose` varchar(50) DEFAULT NULL,
  `regDate` date DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `status` int unsigned NOT NULL DEFAULT '1',
  `ownershipType` enum('Commercial','Private','Government','Ambulance') NOT NULL,
  `deptName` varchar(50) DEFAULT NULL,
  `vSeating` varchar(50) DEFAULT NULL,
  `loadCapacity` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`vId`)
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.vehicle_status_tbl
CREATE TABLE IF NOT EXISTS `vehicle_status_tbl` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vId` int DEFAULT NULL,
  `reg_id` varchar(20) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vId` (`vId`),
  CONSTRAINT `vehicle_status_tbl_ibfk_1` FOREIGN KEY (`vId`) REFERENCES `vehicle` (`vId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.verified_trip
CREATE TABLE IF NOT EXISTS `verified_trip` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tripId` varchar(50) DEFAULT NULL,
  `verifiedby` varchar(50) DEFAULT NULL,
  `vdate` date DEFAULT NULL,
  `vtime` time DEFAULT NULL,
  `remarks` varchar(100) DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table conveydb.villages
CREATE TABLE IF NOT EXISTS `villages` (
  `subdistrict_code` int NOT NULL,
  `village_code` int NOT NULL,
  `village_name` varchar(100) NOT NULL,
  PRIMARY KEY (`subdistrict_code`,`village_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for trigger conveydb.before_trip_verifystatus_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `before_trip_verifystatus_update` BEFORE UPDATE ON `trip_tbl` FOR EACH ROW BEGIN
  -- Only set verifiedtime when verifiystatus changes
  IF NEW.verifiystatus <> OLD.verifiystatus THEN
    SET NEW.verifiedtime = CURRENT_TIME();
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
