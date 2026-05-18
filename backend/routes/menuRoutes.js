const express = require('express');
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { verifyMenuOwnership } = require('../middleware/menuOwnershipMiddleware');
const { uploadMenuImage } = require('../middleware/uploadMiddleware');
const { USER_ROLES } = require('../config/collections');

const router = express.Router();

router.get('/:restaurantId', menuController.getRestaurantMenu);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  uploadMenuImage,
  menuController.createMenuItem,
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyMenuOwnership,
  uploadMenuImage,
  menuController.updateMenuItem,
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyMenuOwnership,
  menuController.deleteMenuItem,
);

module.exports = router;
