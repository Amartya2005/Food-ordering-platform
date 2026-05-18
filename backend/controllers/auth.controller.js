const authService = require('../services/pocketbase/auth.service');
const { sendSuccess } = require('../utils/responseHandler');
const {
  validateRegisterPayload,
  validateLoginPayload,
} = require('../validations/auth.validation');

const throwValidationError = (validationResult) => {
  if (validationResult.valid) {
    return;
  }

  const error = new Error('Request validation failed.');
  error.statusCode = 400;
  error.details = validationResult.errors;
  throw error;
};

const register = async (req, res, next) => {
  try {
    throwValidationError(validateRegisterPayload(req.body));

    const result = await authService.register(req.body);

    return sendSuccess(res, 201, 'User registered successfully.', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    throwValidationError(validateLoginPayload(req.body));

    const result = await authService.login(req.body);

    return sendSuccess(res, 200, 'Login successful.', result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user);

    return sendSuccess(res, 200, 'Current user retrieved successfully.', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
