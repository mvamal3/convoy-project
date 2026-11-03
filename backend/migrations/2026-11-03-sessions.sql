-- Server-side store for the captcha/CSRF session (express-mysql-session).
-- Replaces the in-memory store, which grew with every anonymous visit and
-- was lost on restart. Expired rows are deleted by the app every 15 minutes.
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB;
