const env = require('../config/env');

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.details || undefined,
    stack: env.nodeEnv === 'production' ? undefined : err.stack,
  });
};

module.exports = errorMiddleware;
