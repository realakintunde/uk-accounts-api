// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit test and health endpoints
    return req.path === '/test' || req.path === '/health';
  }
});

// Login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true
});

// Register: 3 per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many accounts created from this IP, try again later' }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter
};
