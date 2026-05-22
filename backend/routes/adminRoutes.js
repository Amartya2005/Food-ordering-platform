const express = require('express');
const adminController = require('../controllers/admin.controller');
const {
  adminOnly,
  validateAdminUserId,
  validateAdminRestaurantId,
} = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(...adminOnly);

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', validateAdminUserId, adminController.deleteUser);

router.get('/restaurants', adminController.getAllRestaurants);
router.put('/restaurants/:id/verify', validateAdminRestaurantId, adminController.verifyRestaurant);
router.delete('/restaurants/:id', validateAdminRestaurantId, adminController.deleteRestaurant);

router.get('/analytics/overview', adminController.getAnalyticsOverview);

module.exports = router;
