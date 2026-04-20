const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/environment');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0
});

// Redis-based rate limiter
const redisRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// User-specific rate limiter (requires authentication)
const userRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per user
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user ? `user:${req.user.id}` : req.ip;
  },
  message: {
    success: false,
    message: 'Too many requests, please slow down.'
  }
});

module.exports = {
  redisRateLimiter,
  userRateLimiter,
  redisClient
};

// To use this, you'll need to install additional packages:
// npm install ioredis rate-limit-redis