const { USER_ROLES } = require('../config/collections');
const { validatePayload } = require('../utils/collectionValidator');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordStrengthPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
const registrationRoles = [USER_ROLES.customer, USER_ROLES.restaurantOwner];

const registerValidationSchema = {
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
      pattern: passwordStrengthPattern,
      patternMessage:
        'password must include uppercase, lowercase, number, and special character.',
    },
    role: {
      type: 'string',
      enum: registrationRoles,
    },
    address: {
      type: 'string',
      min: 5,
      max: 500,
    },
  },
};

const loginValidationSchema = {
  required: ['email', 'password'],
  fields: {
    email: {
      type: 'string',
      pattern: emailPattern,
      patternMessage: 'email must be a valid email address.',
    },
    password: {
      type: 'string',
      min: 1,
      max: 72,
    },
  },
};

const validateRegisterPayload = (payload) => {
  return validatePayload(payload, registerValidationSchema);
};

const validateLoginPayload = (payload) => {
  return validatePayload(payload, loginValidationSchema);
};

module.exports = {
  registerValidationSchema,
  loginValidationSchema,
  validateRegisterPayload,
  validateLoginPayload,
};
