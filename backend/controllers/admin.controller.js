const adminService = require('../services/mysql/admin.service');
const { sendSuccess } = require('../utils/responseHandler');

const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.query);

    return sendSuccess(res, 200, 'Users retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id, req.user);

    return sendSuccess(res, 200, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const getAllRestaurants = async (req, res, next) => {
  try {
    const result = await adminService.getAllRestaurants(req.query);

    return sendSuccess(res, 200, 'Restaurants retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const verifyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await adminService.verifyRestaurant(req.params.id);

    return sendSuccess(res, 200, 'Restaurant verified successfully.', {
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRestaurant = async (req, res, next) => {
  try {
    await adminService.deleteRestaurant(req.params.id);

    return sendSuccess(res, 200, 'Restaurant deleted successfully.');
  } catch (error) {
    next(error);
  }
};

const getAnalyticsOverview = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalyticsOverview();

    return sendSuccess(res, 200, 'Analytics overview retrieved successfully.', analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllRestaurants,
  verifyRestaurant,
  deleteRestaurant,
  getAnalyticsOverview,
};
