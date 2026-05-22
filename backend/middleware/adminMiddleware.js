const authMiddleware = require('./authMiddleware');
const roleMiddleware = require('./roleMiddleware');
const validateRequest = require('./validateRequest');
const { USER_ROLES } = require('../config/collections');
const { validateOrderIdParam } = require('../validations/order.validation');

const adminOnly = [authMiddleware, roleMiddleware(USER_ROLES.admin)];

const validateAdminUserId = (req, res, next) => {
  try {
    const validationResult = validateOrderIdParam('id', req.params.id);

    if (!validationResult.valid) {
      throw validateRequest.buildValidationError(validationResult.errors);
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateAdminRestaurantId = (req, res, next) => {
  try {
    const validationResult = validateOrderIdParam('id', req.params.id);

    if (!validationResult.valid) {
      throw validateRequest.buildValidationError(validationResult.errors);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminOnly,
  validateAdminUserId,
  validateAdminRestaurantId,
};
