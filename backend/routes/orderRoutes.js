const express = require('express');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  verifyOrderAccess,
  verifyOrderStatusManagement,
  verifyRestaurantOrderOwnership,
} = require('../middleware/orderOwnershipMiddleware');
const { USER_ROLES } = require('../config/collections');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.customer, USER_ROLES.admin),
  orderController.createOrder,
);

router.get(
  '/my-orders',
  authMiddleware,
  roleMiddleware(USER_ROLES.customer, USER_ROLES.admin),
  orderController.getCustomerOrders,
);

router.get(
  '/restaurant/:restaurantId',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyRestaurantOrderOwnership,
  orderController.getRestaurantOrders,
);

router.put(
  '/status/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyOrderStatusManagement,
  orderController.updateOrderStatus,
);

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.customer, USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyOrderAccess,
  orderController.getOrderById,
);

module.exports = router;
