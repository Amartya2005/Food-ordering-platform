const { IMAGE_FIELD_OPTIONS } = require('../config/collections');
const { validatePayload } = require('../utils/collectionValidator');

const pocketBaseRecordIdPattern = /^[a-z0-9]{15}$/i;

const restaurantsValidationSchema = {
  required: ['ownerId', 'name', 'category', 'location', 'image'],
  fields: {
    ownerId: {
      type: 'string',
      pattern: pocketBaseRecordIdPattern,
      patternMessage: 'ownerId must be a valid PocketBase record id.',
    },
    name: {
      type: 'string',
      min: 2,
      max: 120,
    },
    category: {
      type: 'string',
      min: 2,
      max: 60,
    },
    location: {
      type: 'string',
      min: 2,
      max: 255,
    },
    image: {
      type: 'file',
      image: IMAGE_FIELD_OPTIONS,
    },
  },
};

const validateRestaurantCreatePayload = (payload) => {
  return validatePayload(payload, restaurantsValidationSchema);
};

const validateRestaurantUpdatePayload = (payload) => {
  return validatePayload(payload, restaurantsValidationSchema, { partial: true });
};

module.exports = {
  restaurantsValidationSchema,
  validateRestaurantCreatePayload,
  validateRestaurantUpdatePayload,
};
