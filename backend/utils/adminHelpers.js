const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

const normalizePositiveInteger = (value, fallback) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return number;
};

const normalizePaginationQuery = (query = {}) => {
  return {
    page: normalizePositiveInteger(query.page, DEFAULT_PAGE),
    perPage: Math.min(normalizePositiveInteger(query.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE),
  };
};

const sanitizeAdminUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address,
    verified: Boolean(user.verified),
    created: user.created_at,
    updated: user.updated_at,
  };
};

const sanitizeAdminUserList = (users = []) => {
  return users.map(sanitizeAdminUser);
};

const sanitizeAdminRestaurant = (restaurant) => {
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

const sanitizeAdminRestaurantList = (restaurants = []) => {
  return restaurants.map(sanitizeAdminRestaurant);
};

module.exports = {
  normalizePaginationQuery,
  sanitizeAdminUser,
  sanitizeAdminUserList,
  sanitizeAdminRestaurant,
  sanitizeAdminRestaurantList,
};
