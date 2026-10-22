
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
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET,

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

// Validate required security configuration
if (!module.exports.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in the environment");
}
