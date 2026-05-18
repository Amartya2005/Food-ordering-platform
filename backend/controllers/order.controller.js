const ordersService = require('../services/pocketbase/orders.service');
const { sendSuccess } = require('../utils/responseHandler');
const {
  validateOrderCreatePayload,
  validateOrderStatusPayload,
  validateOrderStatusFilter,
  validateOrderIdParam,
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

const createOrder = async (req, res, next) => {
  try {
    const validationResult = validateOrderCreatePayload(req.body);
    throwValidationError(validationResult);

    const order = await ordersService.createOrder(validationResult.data, req.user);

    return sendSuccess(res, 201, 'Order placed successfully.', {
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerOrders = async (req, res, next) => {
  try {
    const result = await ordersService.getCustomerOrders(req.user, req.query);

    return sendSuccess(res, 200, 'Orders retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = req.order || (await ordersService.getOrderById(req.params.id, req.user));

    return sendSuccess(res, 200, 'Order retrieved successfully.', {
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getRestaurantOrders = async (req, res, next) => {
  try {
    throwValidationError(validateOrderIdParam('restaurantId', req.params.restaurantId));
    throwValidationError(validateOrderStatusFilter(req.query.status));

    const result = await ordersService.getRestaurantOrders(
      req.params.restaurantId,
      req.user,
      req.query,
    );

    return sendSuccess(res, 200, 'Restaurant orders retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const validationResult = validateOrderStatusPayload(req.body);
    throwValidationError(validationResult);

    const order = await ordersService.updateOrderStatus(req.params.id, validationResult.data.status);

    return sendSuccess(res, 200, 'Order status updated successfully.', {
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
};
