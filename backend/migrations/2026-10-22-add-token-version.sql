-- VAPT finding #2 (Improper Session Expiration)
-- tokenVersion is embedded in every JWT and incremented on logout,
-- so access/refresh tokens issued before logout are rejected immediately.

ALTER TABLE users      ADD COLUMN tokenVersion INT NOT NULL DEFAULT 0;
ALTER TABLE policeuser ADD COLUMN tokenVersion INT NOT NULL DEFAULT 0;
ALTER TABLE admin      ADD COLUMN tokenVersion INT NOT NULL DEFAULT 0;
