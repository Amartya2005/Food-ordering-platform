const ordersService = require('../services/mysql/orders.service');
const { sendSuccess } = require('../utils/responseHandler');

const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user);

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
    const order = await ordersService.updateOrderStatus(req.params.id, req.body.status);

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
