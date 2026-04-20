const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  // Database
  DB_HOST: process.env.DB_HOST || "10.168.2.35",
  DB_PORT: process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME || "myapp",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-secret",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window

  // Auth Rate Limiting
  AUTH_RATE_LIMIT_WINDOW: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15, // minutes
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // attempts per window

  // Password Reset Rate Limiting
  PASSWORD_RESET_RATE_LIMIT_WINDOW:
    parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW) || 60, // minutes
  PASSWORD_RESET_RATE_LIMIT_MAX:
    parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3, // attempts per window

  // Account Creation Rate Limiting
  CREATE_ACCOUNT_RATE_LIMIT_WINDOW:
    parseInt(process.env.CREATE_ACCOUNT_RATE_LIMIT_WINDOW) || 60, // minutes
  CREATE_ACCOUNT_RATE_LIMIT_MAX:
    parseInt(process.env.CREATE_ACCOUNT_RATE_LIMIT_MAX) || 3, // attempts per window
};
