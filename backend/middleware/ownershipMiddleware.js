const restaurantsService = require('../services/pocketbase/restaurants.service');

const verifyRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await restaurantsService.verifyRestaurantOwnership(restaurantId, req.user);

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyRestaurantOwnership,
};
