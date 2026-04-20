const rateLimit = require("express-rate-limit");
const config = require("../config/environment");

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, // 15 minutes by default
  max: 100000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    retryAfter: config.RATE_LIMIT_WINDOW * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
      retryAfter: config.RATE_LIMIT_WINDOW * 60,
    });
  },
});

// Strict rate limiter for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000, // Allow 100000 failed attempts per window
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts, please try again after 15 minutes.",
      retryAfter: 15 * 60,
    });
  },
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: "Too many password reset attempts, please try again after 1 hour.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many password reset attempts, please try again after 1 hour.",
      retryAfter: 60 * 60,
    });
  },
});

// Create account limiter (registration)
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 account creation attempts per hour per IP
  message: {
    success: false,
    message:
      "Too many account creation attempts, please try again after 1 hour.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many account creation attempts, please try again after 1 hour.",
      retryAfter: 60 * 60,
    });
  },
});

// API endpoint specific limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100000, // 20 requests per minute
  message: {
    success: false,
    message: "API rate limit exceeded, please slow down your requests.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// High-limit API limiter for heavy endpoints
const highLimitApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000000, // 1 million requests per minute
  message: {
    success: false,
    message: "Too many requests from this IP, please slow down.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  createAccountLimiter,
  apiLimiter,
  highLimitApiLimiter,
};
