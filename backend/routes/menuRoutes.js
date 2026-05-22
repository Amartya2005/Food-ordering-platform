const express = require('express');
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { verifyMenuOwnership } = require('../middleware/menuOwnershipMiddleware');
const { uploadMenuImage } = require('../middleware/uploadMiddleware');
const { USER_ROLES } = require('../config/collections');
const {
  validateMenuItemCreatePayload,
  validateMenuItemUpdatePayload,
  validateRecordId,
} = require('../validations/menu.validation');

const router = express.Router();

router.get(
  '/:restaurantId',
  validateRequest((req) => validateRecordId('restaurantId', req.params.restaurantId)),
  menuController.getRestaurantMenu,
);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  uploadMenuImage,
  validateRequest((req) => validateMenuItemCreatePayload(req.body, req.file), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  menuController.createMenuItem,
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(USER_ROLES.restaurantOwner, USER_ROLES.admin),
  verifyMenuOwnership,
  uploadMenuImage,
  validateRequest((req) => validateMenuItemUpdatePayload(req.body, req.file), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
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
