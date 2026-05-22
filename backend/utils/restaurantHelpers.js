const sanitizeRestaurant = (restaurant) => {
  if (!restaurant) return null;

  return {
    id: restaurant.id,
    ownerId: restaurant.owner_id,
    name: restaurant.name,
    category: restaurant.category,
    location: restaurant.location,
    imageUrl: restaurant.image_url || null,
    isVerified: Boolean(restaurant.is_verified),
    created: restaurant.created_at,
    updated: restaurant.updated_at,
  };
};

const sanitizeRestaurantList = (restaurants) => {
  return restaurants.map(sanitizeRestaurant);
};

module.exports = {
  sanitizeRestaurant,
  sanitizeRestaurantList,
};
