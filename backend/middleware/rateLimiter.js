const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { createErrorResponse } = require('../utils/responseHelpers');

const createRateLimiter = (options = {}) => {
  const {
    max = env.rateLimit.max,
    windowMs = env.rateLimit.windowMs,
    message = 'Too many requests. Please try again later.',
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json(createErrorResponse(message));
    },
  });
};

const apiLimiter = createRateLimiter();
const authLimiter = createRateLimiter({
  max: env.rateLimit.authMax,
  message: 'Too many authentication attempts. Please try again later.',
});
const adminLimiter = createRateLimiter({
  max: env.rateLimit.adminMax,
  message: 'Too many admin requests. Please try again later.',
});
const orderLimiter = createRateLimiter({
  max: env.rateLimit.orderMax,
  message: 'Too many order requests. Please try again later.',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  adminLimiter,
  orderLimiter,
};
