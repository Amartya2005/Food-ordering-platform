const { USER_ROLES } = require('../config/collections');
const { validatePayload } = require('../utils/collectionValidator');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usersValidationSchema = {
  required: ['name', 'email', 'password', 'role', 'address'],
  fields: {
    name: {
      type: 'string',
      min: 2,
      max: 80,
    },
    email: {
      type: 'string',
      pattern: emailPattern,
      patternMessage: 'email must be a valid email address.',
    },
    password: {
      type: 'string',
      min: 8,
      max: 72,
    },
    role: {
      type: 'string',
      enum: Object.values(USER_ROLES),
    },
    address: {
      type: 'string',
      min: 5,
      max: 500,
    },
  },
};

const validateUserCreatePayload = (payload) => {
  return validatePayload(payload, usersValidationSchema);
};

const validateUserUpdatePayload = (payload) => {
  return validatePayload(payload, usersValidationSchema, { partial: true });
};

module.exports = {
  usersValidationSchema,
  validateUserCreatePayload,
  validateUserUpdatePayload,
};
