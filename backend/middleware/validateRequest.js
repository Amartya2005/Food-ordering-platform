const buildValidationError = (errors) => {
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.details = errors;
  return error;
};

const validateRequest = (validator, options = {}) => {
  const { applyData } = options;

  return (req, res, next) => {
    try {
      const validationResult = validator(req);

      if (!validationResult || validationResult.valid !== true) {
        throw buildValidationError(
          validationResult && Array.isArray(validationResult.errors) ? validationResult.errors : [],
        );
      }

      if (applyData && validationResult.data !== undefined) {
        applyData(req, validationResult.data);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

validateRequest.buildValidationError = buildValidationError;

module.exports = validateRequest;
