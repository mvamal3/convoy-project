const rateLimit = require("express-rate-limit");
const config = require("../config/environment");

// Strict rate limiter for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW * 60 * 1000,
  max: config.AUTH_RATE_LIMIT_MAX, // failed attempts per window per IP
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

// High-limit API limiter for heavy endpoints
const highLimitApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // requests per minute per IP
  message: {
    success: false,
    message: "Too many requests from this IP, please slow down.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session refresh limiter. Kept separate from authLimiter because every
// page load tries a refresh, and a visitor without a session gets a 401.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // refresh requests per window per IP
  message: {
    success: false,
    message: "Too many session refresh attempts, please try again later.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP requests (resend OTP, forgot password). Every request counts, because
// these endpoints always reply with success to avoid revealing accounts.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // OTP requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many OTP requests, please try again after 15 minutes.",
      retryAfter: 15 * 60,
    });
  },
});

module.exports = {
  authLimiter,
  otpRequestLimiter,
  refreshLimiter,
  createAccountLimiter,
  highLimitApiLimiter,
};
