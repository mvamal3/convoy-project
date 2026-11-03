const config = require("../config/environment");
const httpError = require("./httpError");

// Account lockout. After LOCKOUT_MAX_ATTEMPTS wrong passwords in a row the
// account refuses every login for LOCKOUT_MINUTES, whatever IP the attempts
// come from. A successful login, a password reset or an admin unlock clears it.

const lockedMessage = (lockedUntil) => {
  const minutes = Math.max(Math.ceil((lockedUntil - Date.now()) / 60000), 1);
  return `Account locked due to multiple failed login attempts. Please try again after ${minutes} minute(s) or reset your password.`;
};

const isLocked = (account) => (Number(account?.lockedUntil) || 0) > Date.now();

// Throws when the account is currently locked.
const assertNotLocked = (account) => {
  if (isLocked(account)) {
    throw httpError(lockedMessage(Number(account.lockedUntil)), 423);
  }
};

// Count a wrong password. Returns true when this attempt locked the account.
// The count is incremented in SQL so parallel wrong guesses each count.
const recordFailedLogin = async (account) => {
  await account.increment("failedLoginAttempts");
  await account.reload({ attributes: ["id", "failedLoginAttempts"] });

  if (Number(account.failedLoginAttempts) < config.LOCKOUT_MAX_ATTEMPTS) {
    return false;
  }

  account.failedLoginAttempts = 0;
  account.lockedUntil = Date.now() + config.LOCKOUT_MINUTES * 60 * 1000;
  await account.save({ hooks: false, fields: ["failedLoginAttempts", "lockedUntil"] });
  return true;
};

// Reset the counter (the caller saves the record).
const clearFailedLogins = (account) => {
  account.failedLoginAttempts = 0;
  account.lockedUntil = null;
};

module.exports = {
  isLocked,
  assertNotLocked,
  recordFailedLogin,
  clearFailedLogins,
  lockedMessage,
};
