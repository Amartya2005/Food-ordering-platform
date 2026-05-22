const express = require('express');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  verifyOrderAccess,
  verifyOrderStatusManagement,
  verifyRestaurantOrderOwnership,
} = require('../middleware/orderOwnershipMiddleware');
const { USER_ROLES } = require('../config/collections');
const {
  validateOrderCreatePayload,
  validateOrderStatusPayload,
  validateOrderStatusFilter,
  validateOrderIdParam,
} = require('../validations/order.validation');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.customer, USER_ROLES.admin),
  validateRequest((req) => validateOrderCreatePayload(req.body), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
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
  validateRequest((req) => validateOrderIdParam('restaurantId', req.params.restaurantId)),
  validateRequest((req) => validateOrderStatusFilter(req.query.status)),
  verifyRestaurantOrderOwnership,
  orderController.getRestaurantOrders,
);

router.put(
  '/status/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  validateRequest((req) => validateOrderStatusPayload(req.body), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  verifyOrderStatusManagement,
  orderController.updateOrderStatus,
);

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.customer, USER_ROLES.restaurantOwner, USER_ROLES.admin),
  validateRequest((req) => validateOrderIdParam('id', req.params.id)),
  verifyOrderAccess,
  orderController.getOrderById,
);

module.exports = router;
