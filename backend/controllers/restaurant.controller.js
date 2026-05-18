const restaurantsService = require('../services/pocketbase/restaurants.service');
const { sendSuccess } = require('../utils/responseHandler');
const {
  validateRestaurantCreatePayload,
  validateRestaurantUpdatePayload,
} = require('../validations/restaurant.validation');

const throwValidationError = (validationResult) => {
  if (validationResult.valid) {
    return;
  }

  const error = new Error('Request validation failed.');
  error.statusCode = 400;
  error.details = validationResult.errors;
  throw error;
};

const getRestaurants = async (req, res, next) => {
  try {
    const result = await restaurantsService.getRestaurants(req.query);

    return sendSuccess(res, 200, 'Restaurants retrieved successfully.', result);
  } catch (error) {
    next(error);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await restaurantsService.getRestaurantById(req.params.id);

    return sendSuccess(res, 200, 'Restaurant retrieved successfully.', {
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const createRestaurant = async (req, res, next) => {
  try {
    const validationResult = validateRestaurantCreatePayload(req.body, req.file);
    throwValidationError(validationResult);

    const restaurant = await restaurantsService.createRestaurant(
      validationResult.data,
      req.file,
      req.user,
    );

    return sendSuccess(res, 201, 'Restaurant created successfully.', {
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const validationResult = validateRestaurantUpdatePayload(req.body, req.file);
    throwValidationError(validationResult);

    const restaurant = await restaurantsService.updateRestaurant(
      req.params.id,
      validationResult.data,
      req.file,
    );

    return sendSuccess(res, 200, 'Restaurant updated successfully.', {
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRestaurant = async (req, res, next) => {
  try {
    await restaurantsService.deleteRestaurant(req.params.id);

    return sendSuccess(res, 200, 'Restaurant deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
