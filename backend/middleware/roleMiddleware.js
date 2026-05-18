const { USER_ROLES } = require('../config/collections');

const validRoles = Object.values(USER_ROLES);

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const flattenedRoles = allowedRoles.flat();
      const invalidRoles = flattenedRoles.filter((role) => !validRoles.includes(role));

      if (invalidRoles.length > 0) {
        const error = new Error(`Invalid role configuration: ${invalidRoles.join(', ')}`);
        error.statusCode = 500;
        throw error;
      }

      if (!req.user) {
        const error = new Error('Authentication is required before role authorization.');
        error.statusCode = 401;
        throw error;
      }

      if (!flattenedRoles.includes(req.user.role)) {
        const error = new Error('You do not have permission to access this resource.');
        error.statusCode = 403;
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

roleMiddleware.customer = roleMiddleware(USER_ROLES.customer);
roleMiddleware.restaurantOwner = roleMiddleware(USER_ROLES.restaurantOwner);
roleMiddleware.admin = roleMiddleware(USER_ROLES.admin);

module.exports = roleMiddleware;
