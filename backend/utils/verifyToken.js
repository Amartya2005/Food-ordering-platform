const jwt = require('jsonwebtoken');
const env = require('../config/env');

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    const authError = new Error('Invalid or expired authentication token.');
    authError.statusCode = 401;
    authError.code = error.name;
    throw authError;
  }
};

module.exports = verifyToken;
