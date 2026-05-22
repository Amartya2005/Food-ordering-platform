const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { verifyRestaurantOwnership } = require('../middleware/ownershipMiddleware');
const { uploadRestaurantImage } = require('../middleware/uploadMiddleware');
const { USER_ROLES } = require('../config/collections');
const {
  validateRestaurantCreatePayload,
  validateRestaurantUpdatePayload,
} = require('../validations/restaurant.validation');
const { validateOrderIdParam } = require('../validations/order.validation');

const router = express.Router();

router.get('/', restaurantController.getRestaurants);
router.get(
  '/:id',
  validateRequest((req) => validateOrderIdParam('id', req.params.id)),
  restaurantController.getRestaurantById,
);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  uploadRestaurantImage,
  validateRequest((req) => validateRestaurantCreatePayload(req.body, req.file), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  restaurantController.createRestaurant,
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  validateRequest((req) => validateOrderIdParam('id', req.params.id)),
  verifyRestaurantOwnership,
  uploadRestaurantImage,
  validateRequest((req) => validateRestaurantUpdatePayload(req.body, req.file), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  restaurantController.updateRestaurant,
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  validateRequest((req) => validateOrderIdParam('id', req.params.id)),
  verifyRestaurantOwnership,
  restaurantController.deleteRestaurant,
);

module.exports = router;
