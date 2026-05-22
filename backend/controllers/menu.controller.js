const menuService = require('../services/mysql/menu.service');
const { sendSuccess } = require('../utils/responseHandler');

const getRestaurantMenu = async (req, res, next) => {
  try {
    const result = await menuService.getRestaurantMenu(req.params.restaurantId, req.query);

    return sendSuccess(res, 200, 'Restaurant menu retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const menuItem = await menuService.createMenuItem(
      req.body,
      req.file,
      req.user,
    );

    return sendSuccess(res, 201, 'Menu item created successfully.', {
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const onlyAvailabilityChanged =
      Object.keys(req.body).length === 1 &&
      Object.prototype.hasOwnProperty.call(req.body, 'availability') &&
      !req.file;

    const menuItem = onlyAvailabilityChanged
      ? await menuService.toggleAvailability(req.params.id, req.body.availability)
      : await menuService.updateMenuItem(req.params.id, req.body, req.file);

    return sendSuccess(res, 200, 'Menu item updated successfully.', {
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    await menuService.deleteMenuItem(req.params.id);

    return sendSuccess(res, 200, 'Menu item deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurantMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
