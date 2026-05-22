const authService = require('../services/mysql/auth.service');
const { sendSuccess } = require('../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    return sendSuccess(res, 201, 'User registered successfully.', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
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
