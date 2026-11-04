-- A license may be held by several users (a driver can change employer) and a
-- deleted driver may be re-added, so licenseNo can no longer be unique.
-- AuthService.registerDriver stops the same user adding it twice while active.
-- Unique index names can differ between servers, so they are looked up here.
SET @sql := (
  SELECT CONCAT('ALTER TABLE `driver_tbl` ', GROUP_CONCAT(DISTINCT CONCAT('DROP INDEX `', INDEX_NAME, '`')))
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'driver_tbl'
    AND COLUMN_NAME = 'licenseNo'
    AND NON_UNIQUE = 0
);
SET @sql := IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX `idx_driver_licenseNo` ON `driver_tbl` (`licenseNo`);
