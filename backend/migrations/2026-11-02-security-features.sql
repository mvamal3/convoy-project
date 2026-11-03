-- Security features: account lockout, citizen freeze, OTP store, audit log.
-- Apply once on each database (dev, staging, production) before deploying
-- the matching backend.

-- Account lockout: failed attempts since the last successful login, and the
-- time (epoch milliseconds) until which login is refused.
ALTER TABLE users      ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0,
                       ADD COLUMN lockedUntil BIGINT NULL;
ALTER TABLE policeuser ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0,
                       ADD COLUMN lockedUntil BIGINT NULL;
ALTER TABLE admin      ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0,
                       ADD COLUMN lockedUntil BIGINT NULL;

-- Admin can freeze a citizen account. Kept separate from isActive, which
-- means "OTP verified".
ALTER TABLE users ADD COLUMN isFrozen TINYINT(1) NOT NULL DEFAULT 0;

-- One-time passwords for registration and password reset. Only a bcrypt
-- hash of the code is stored; each code expires and allows limited attempts.
CREATE TABLE IF NOT EXISTS auth_otp (
  id          INT NOT NULL AUTO_INCREMENT,
  accountType VARCHAR(10) NOT NULL,          -- user | police
  accountId   VARCHAR(64) NOT NULL,
  purpose     VARCHAR(20) NOT NULL,          -- register | reset
  otpHash     VARCHAR(100) NOT NULL,
  expiresAt   BIGINT NOT NULL,               -- epoch milliseconds
  attempts    INT NOT NULL DEFAULT 0,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  createdAt   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_auth_otp_account (accountType, accountId, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Audit trail of security-relevant actions. Rows are only ever inserted.
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT NOT NULL AUTO_INCREMENT,
  actorType  VARCHAR(10) NULL,               -- user | police | admin
  actorId    VARCHAR(64) NULL,
  actorName  VARCHAR(100) NULL,              -- email / userid at the time
  action     VARCHAR(50) NOT NULL,
  status     VARCHAR(10) NOT NULL,           -- success | failure
  targetType VARCHAR(20) NULL,
  targetId   VARCHAR(64) NULL,
  ip         VARCHAR(45) NULL,
  userAgent  VARCHAR(255) NULL,
  details    VARCHAR(500) NULL,
  createdAt  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_created (createdAt),
  KEY idx_audit_action (action),
  KEY idx_audit_actor (actorType, actorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
