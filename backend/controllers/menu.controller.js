const menuService = require('../services/pocketbase/menu.service');
const { sendSuccess } = require('../utils/responseHandler');
const {
  validateMenuItemCreatePayload,
  validateMenuItemUpdatePayload,
  validatePocketBaseId,
} = require('../validations/menu.validation');

const throwValidationError = (validationResult) => {
  if (validationResult.valid) {
    return;
  }

  const error = new Error('Request validation failed.');
  error.statusCode = 400;
  error.details = validationResult.errors;
  throw error;
};

const getRestaurantMenu = async (req, res, next) => {
  try {
    throwValidationError(validatePocketBaseId('restaurantId', req.params.restaurantId));

    const result = await menuService.getRestaurantMenu(req.params.restaurantId, req.query);

    return sendSuccess(res, 200, 'Restaurant menu retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const validationResult = validateMenuItemCreatePayload(req.body, req.file);
    throwValidationError(validationResult);

    const menuItem = await menuService.createMenuItem(
      validationResult.data,
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
    const validationResult = validateMenuItemUpdatePayload(req.body, req.file);
    throwValidationError(validationResult);

    const onlyAvailabilityChanged =
      Object.keys(validationResult.data).length === 1 &&
      Object.prototype.hasOwnProperty.call(validationResult.data, 'availability') &&
      !req.file;

    const menuItem = onlyAvailabilityChanged
      ? await menuService.toggleAvailability(req.params.id, validationResult.data.availability)
      : await menuService.updateMenuItem(req.params.id, validationResult.data, req.file);

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
