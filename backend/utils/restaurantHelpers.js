const { getPocketBase } = require('../config/pocketbase');
const { getPocketBaseFileUrl } = require('./fileHelpers');

const sanitizeRestaurant = (restaurant, client = getPocketBase()) => {
  if (!restaurant) {
    return null;
  }

  return {
    id: restaurant.id,
    ownerId: restaurant.ownerId,
    name: restaurant.name,
    category: restaurant.category,
    location: restaurant.location,
    image: restaurant.image,
    imageUrl: getPocketBaseFileUrl(client, restaurant, restaurant.image),
    created: restaurant.created,
    updated: restaurant.updated,
  };
};

const sanitizeRestaurantList = (restaurants, client = getPocketBase()) => {
  return restaurants.map((restaurant) => sanitizeRestaurant(restaurant, client));
};

module.exports = {
  sanitizeRestaurant,
  sanitizeRestaurantList,
};
