const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { verifyRestaurantOwnership } = require('../middleware/ownershipMiddleware');
const { uploadRestaurantImage } = require('../middleware/uploadMiddleware');
const { USER_ROLES } = require('../config/collections');

const router = express.Router();

router.get('/', restaurantController.getRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  uploadRestaurantImage,
  restaurantController.createRestaurant,
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyRestaurantOwnership,
  uploadRestaurantImage,
  restaurantController.updateRestaurant,
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyRestaurantOwnership,
  restaurantController.deleteRestaurant,
);

module.exports = router;
