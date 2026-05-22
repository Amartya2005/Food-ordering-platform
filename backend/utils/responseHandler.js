const { createSuccessResponse, createErrorResponse } = require('./responseHelpers');

const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json(createSuccessResponse(message, data));
};

const sendError = (res, statusCode, message, errors = undefined) => {
  return res.status(statusCode).json(createErrorResponse(message, errors));
};

module.exports = {
  sendSuccess,
  sendError,
};
