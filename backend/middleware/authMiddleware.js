const verifyToken = require('../utils/verifyToken');
const { extractBearerToken } = require('../utils/authHelpers');
const { USER_ROLES } = require('../config/collections');

const authMiddleware = (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      const error = new Error('Authentication token is required.');
      error.statusCode = 401;
      throw error;
    }

    const decodedToken = verifyToken(token);
    const userId = decodedToken.sub || decodedToken.id;
    const validRoles = Object.values(USER_ROLES);

    if (!userId || !decodedToken.email || !validRoles.includes(decodedToken.role)) {
      const error = new Error('Invalid authentication token claims.');
      error.statusCode = 401;
      throw error;
    }

    req.user = {
      id: userId,
      email: decodedToken.email,
      role: decodedToken.role,
      name: decodedToken.name,
      address: decodedToken.address,
      tokenIssuedAt: decodedToken.iat,
      tokenExpiresAt: decodedToken.exp,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
