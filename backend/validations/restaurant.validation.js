const { validateImageUpload } = require('../utils/fileHelpers');
const { validatePayload } = require('../utils/collectionValidator');

const allowedBodyFields = ['name', 'category', 'location'];

const restaurantValidationSchema = {
  required: ['name', 'category', 'location'],
  fields: {
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
  },
};

const trimRestaurantPayload = (payload) => {
  return allowedBodyFields.reduce((cleanPayload, field) => {
    if (payload[field] !== undefined) {
      cleanPayload[field] =
        typeof payload[field] === 'string' ? payload[field].trim() : payload[field];
    }

    return cleanPayload;
  }, {});
};

const validateUnexpectedFields = (payload) => {
  return Object.keys(payload)
    .filter((field) => !allowedBodyFields.includes(field))
    .map((field) => ({
      field,
      message: `${field} is not allowed.`,
    }));
};

const validateRestaurantCreatePayload = (payload, file) => {
  const cleanPayload = trimRestaurantPayload(payload);
  const payloadValidation = validatePayload(cleanPayload, restaurantValidationSchema);
  const errors = [
    ...validateUnexpectedFields(payload),
    ...payloadValidation.errors,
    ...validateImageUpload(file, { required: true }),
  ];

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

const validateRestaurantUpdatePayload = (payload, file) => {
  const cleanPayload = trimRestaurantPayload(payload);
  const payloadValidation = validatePayload(cleanPayload, restaurantValidationSchema, {
    partial: true,
  });
  const errors = [
    ...validateUnexpectedFields(payload),
    ...payloadValidation.errors,
    ...validateImageUpload(file),
  ];

  if (Object.keys(cleanPayload).length === 0 && !file) {
    errors.push({
      field: 'body',
      message: 'At least one restaurant field or image is required.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

module.exports = {
  restaurantValidationSchema,
  validateRestaurantCreatePayload,
  validateRestaurantUpdatePayload,
};
