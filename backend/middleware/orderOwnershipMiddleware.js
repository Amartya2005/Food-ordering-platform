const ordersService = require('../services/mysql/orders.service');
const validateRequest = require('./validateRequest');
const {
  validateOrderIdParam,
  validateOrderStatusPayload,
} = require('../validations/order.validation');

const verifyOrderAccess = async (req, res, next) => {
  try {
    const idValidation = validateOrderIdParam('id', req.params.id);

    if (!idValidation.valid) {
      throw validateRequest.buildValidationError(idValidation.errors);
    }

    const order = await ordersService.verifyOrderAccess(req.params.id, req.user);

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyOrderStatusManagement = async (req, res, next) => {
  try {
    const idValidation = validateOrderIdParam('id', req.params.id);
    const bodyValidation = validateOrderStatusPayload(req.body);

    if (!idValidation.valid) {
      throw validateRequest.buildValidationError(idValidation.errors);
    }

    if (!bodyValidation.valid) {
      throw validateRequest.buildValidationError(bodyValidation.errors);
    }

    const order = await ordersService.verifyOrderStatusManagement(req.params.id, req.user);

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyRestaurantOrderOwnership = async (req, res, next) => {
  try {
    const validationResult = validateOrderIdParam('restaurantId', req.params.restaurantId);

    if (!validationResult.valid) {
      throw validateRequest.buildValidationError(validationResult.errors);
    }

    const restaurant = await ordersService.verifyRestaurantOrderOwnership(
      req.params.restaurantId,
      req.user,
    );

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyOrderAccess,
  verifyOrderStatusManagement,
  verifyRestaurantOrderOwnership,
};
