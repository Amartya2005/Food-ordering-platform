const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (user) => {
  if (!user || !user.id || !user.email || !user.role) {
    throw new Error('A valid user payload is required to generate a token.');
  }

  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      address: user.address,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );
};

module.exports = generateToken;
