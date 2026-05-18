const { validatePayload } = require('../utils/collectionValidator');
const { validateImageUpload } = require('../utils/fileHelpers');

const pocketBaseRecordIdPattern = /^[a-z0-9]{15}$/i;
const createBodyFields = ['restaurantId', 'itemName', 'price', 'availability'];
const updateBodyFields = ['itemName', 'price', 'availability'];

const menuValidationSchema = {
  required: ['restaurantId', 'itemName', 'price'],
  fields: {
    restaurantId: {
      type: 'string',
      pattern: pocketBaseRecordIdPattern,
      patternMessage: 'restaurantId must be a valid PocketBase record id.',
    },
    itemName: {
      type: 'string',
      min: 2,
      max: 120,
    },
    price: {
      type: 'number',
      min: 0,
    },
    availability: {
      type: 'boolean',
    },
  },
};

const parseBoolean = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return value;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsedValue = Number(value);

  return Number.isNaN(parsedValue) ? value : parsedValue;
};

const normalizeMenuPayload = (payload, allowedFields) => {
  return allowedFields.reduce((cleanPayload, field) => {
    if (payload[field] === undefined) {
      return cleanPayload;
    }

    if (field === 'price') {
      cleanPayload[field] = parseNumber(payload[field]);
      return cleanPayload;
    }

    if (field === 'availability') {
      cleanPayload[field] = parseBoolean(payload[field]);
      return cleanPayload;
    }

    cleanPayload[field] =
      typeof payload[field] === 'string' ? payload[field].trim() : payload[field];

    return cleanPayload;
  }, {});
};

const validateUnexpectedFields = (payload, allowedFields) => {
  return Object.keys(payload)
    .filter((field) => !allowedFields.includes(field))
    .map((field) => ({
      field,
      message: `${field} is not allowed.`,
    }));
};

const validateMenuItemCreatePayload = (payload, file) => {
  const cleanPayload = normalizeMenuPayload(payload, createBodyFields);

  if (cleanPayload.availability === undefined) {
    cleanPayload.availability = true;
  }

  const payloadValidation = validatePayload(cleanPayload, menuValidationSchema);
  const errors = [
    ...validateUnexpectedFields(payload, createBodyFields),
    ...payloadValidation.errors,
    ...validateImageUpload(file, { required: true }),
  ];

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

const validateMenuItemUpdatePayload = (payload, file) => {
  const cleanPayload = normalizeMenuPayload(payload, updateBodyFields);
  const payloadValidation = validatePayload(cleanPayload, menuValidationSchema, {
    partial: true,
  });
  const errors = [
    ...validateUnexpectedFields(payload, updateBodyFields),
    ...payloadValidation.errors,
    ...validateImageUpload(file),
  ];

  if (Object.keys(cleanPayload).length === 0 && !file) {
    errors.push({
      field: 'body',
      message: 'At least one menu item field or image is required.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

const validatePocketBaseId = (field, value) => {
  if (!value || !pocketBaseRecordIdPattern.test(value)) {
    return {
      valid: false,
      errors: [
        {
          field,
          message: `${field} must be a valid PocketBase record id.`,
        },
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
};

module.exports = {
  menuValidationSchema,
  validateMenuItemCreatePayload,
  validateMenuItemUpdatePayload,
  validatePocketBaseId,
};
