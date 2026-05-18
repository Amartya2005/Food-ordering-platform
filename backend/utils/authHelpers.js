const bcrypt = require('bcryptjs');
const env = require('../config/env');

const normalizeEmail = (email) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address,
    verified: user.verified,
    created: user.created,
    updated: user.updated,
  };
};

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const createAuthError = (message = 'Authentication failed.', statusCode = 401, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, env.bcryptSaltRounds);
};

const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

module.exports = {
  normalizeEmail,
  sanitizeUser,
  extractBearerToken,
  createAuthError,
  hashPassword,
  comparePassword,
};
