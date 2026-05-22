const createSuccessResponse = (message, data = null) => {
  return {
    success: true,
    message,
    data,
  };
};

const createErrorResponse = (message, errors = undefined) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
};
