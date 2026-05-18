const ordersService = require('../services/pocketbase/orders.service');
const {
  validateOrderIdParam,
  validateOrderStatusPayload,
} = require('../validations/order.validation');

const throwValidationError = (validationResult) => {
  if (validationResult.valid) {
    return;
  }

  const error = new Error('Request validation failed.');
  error.statusCode = 400;
  error.details = validationResult.errors;
  throw error;
};

const verifyOrderAccess = async (req, res, next) => {
  try {
    throwValidationError(validateOrderIdParam('id', req.params.id));

    const order = await ordersService.verifyOrderAccess(req.params.id, req.user);

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyOrderStatusManagement = async (req, res, next) => {
  try {
    throwValidationError(validateOrderIdParam('id', req.params.id));
    throwValidationError(validateOrderStatusPayload(req.body));

    const order = await ordersService.verifyOrderStatusManagement(req.params.id, req.user);

    req.order = order;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyRestaurantOrderOwnership = async (req, res, next) => {
  try {
    throwValidationError(validateOrderIdParam('restaurantId', req.params.restaurantId));

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
