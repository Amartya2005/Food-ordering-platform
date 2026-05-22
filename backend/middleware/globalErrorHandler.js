const env = require('../config/env');
const { createErrorResponse } = require('../utils/responseHelpers');

const sanitizeErrorMessage = (error, statusCode) => {
  if (statusCode >= 500 && env.nodeEnv === 'production') {
    return 'Internal server error';
  }

  return error.message || 'Internal server error';
};

const sanitizeErrorDetails = (error, statusCode) => {
  if (statusCode >= 500 && env.nodeEnv === 'production') {
    return undefined;
  }

  return error.details;
};

const globalErrorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || error.status || 500;
  const response = createErrorResponse(
    sanitizeErrorMessage(error, statusCode),
    sanitizeErrorDetails(error, statusCode),
  );

  if (env.nodeEnv !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = globalErrorHandler;
