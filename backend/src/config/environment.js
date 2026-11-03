
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  // Interface to listen on. Keep the API behind the web server's reverse proxy.
  HOST: process.env.HOST || "127.0.0.1",
  // Number of reverse proxies in front of the API (e.g. 1 for Apache), 0 for none
  TRUST_PROXY: parseInt(process.env.TRUST_PROXY, 10) || 0,

  // Database
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME || "myapp",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  // Refresh token lifetime doubles as the server-side idle timeout:
  // a session not refreshed within this time cannot be resumed.
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "20m",

  // Session limits
  // Absolute session length; after this the user must log in again.
  SESSION_MAX_HOURS: parseFloat(process.env.SESSION_MAX_HOURS) || 12,
  // A new login revokes every earlier session of the same account.
  SINGLE_SESSION: process.env.SINGLE_SESSION !== "false",

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET,
  // Mark cookies Secure. Set true when the site is served over HTTPS
  // (the API is only reachable through the HTTPS reverse proxy).
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : (process.env.NODE_ENV || "development") === "production",

  // Account lockout: failed logins allowed before the account is locked,
  // and how long the lock lasts.
  LOCKOUT_MAX_ATTEMPTS: parseInt(process.env.LOCKOUT_MAX_ATTEMPTS, 10) || 5,
  LOCKOUT_MINUTES: parseInt(process.env.LOCKOUT_MINUTES, 10) || 15,

  // One-time passwords
  OTP_TTL_MINUTES: parseInt(process.env.OTP_TTL_MINUTES, 10) || 5,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  OTP_RESEND_SECONDS: parseInt(process.env.OTP_RESEND_SECONDS, 10) || 60,
  OTP_MAX_PER_HOUR: parseInt(process.env.OTP_MAX_PER_HOUR, 10) || 5,
  // Fixed code for environments without an SMS/email gateway. Never set
  // this on a server the auditors test.
  OTP_FIXED: /^\d{6}$/.test(process.env.OTP_FIXED || "")
    ? process.env.OTP_FIXED
    : null,

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Auth Rate Limiting
  AUTH_RATE_LIMIT_WINDOW:
    parseInt(process.env.AUTH_RATE_LIMIT_WINDOW, 10) || 15,
  AUTH_RATE_LIMIT_MAX:
    parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,

  // Password Reset Rate Limiting
  PASSWORD_RESET_RATE_LIMIT_WINDOW:
    parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW, 10) || 60,
  PASSWORD_RESET_RATE_LIMIT_MAX:
    parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX, 10) || 3,

  // Account Creation Rate Limiting
  CREATE_ACCOUNT_RATE_LIMIT_WINDOW:
    parseInt(process.env.CREATE_ACCOUNT_RATE_LIMIT_WINDOW, 10) || 60,
  CREATE_ACCOUNT_RATE_LIMIT_MAX:
    parseInt(process.env.CREATE_ACCOUNT_RATE_LIMIT_MAX, 10) || 3,
};

// Validate required security configuration. No defaults: a known secret
// would let anyone sign their own tokens.
for (const key of ["SESSION_SECRET", "JWT_SECRET", "JWT_REFRESH_SECRET"]) {
  if (!module.exports[key]) {
    throw new Error(`${key} is required in the environment`);
  }
}
