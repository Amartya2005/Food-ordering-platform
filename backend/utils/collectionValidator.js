const isEmpty = (value) => {
  return value === undefined || value === null || value === '';
};

const getFileMimeType = (file) => {
  return file.mimetype || file.mimeType || file.type || '';
};

const getFileSize = (file) => {
  return file.size || 0;
};

const validateRequiredFields = (payload, requiredFields) => {
  return requiredFields
    .filter((field) => isEmpty(payload[field]))
    .map((field) => ({
      field,
      message: `${field} is required.`,
    }));
};

const validateType = (field, value, expectedType) => {
  if (isEmpty(value)) {
    return null;
  }

  const validators = {
    string: () => typeof value === 'string',
    number: () => typeof value === 'number' && Number.isFinite(value),
    boolean: () => typeof value === 'boolean',
    array: () => Array.isArray(value),
    object: () => typeof value === 'object' && !Array.isArray(value),
    json: () => typeof value === 'object',
    file: () => typeof value === 'object',
  };

  const isValid = validators[expectedType] ? validators[expectedType]() : true;

  if (isValid) {
    return null;
  }

  return {
    field,
    message: `${field} must be a valid ${expectedType}.`,
  };
};

const validateEnum = (field, value, allowedValues) => {
  if (isEmpty(value) || !allowedValues || allowedValues.includes(value)) {
    return null;
  }

  return {
    field,
    message: `${field} must be one of: ${allowedValues.join(', ')}.`,
  };
};

const validateRange = (field, value, config) => {
  if (isEmpty(value) || typeof value !== 'number') {
    return null;
  }

  if (config.min !== undefined && value < config.min) {
    return {
      field,
      message: `${field} must be greater than or equal to ${config.min}.`,
    };
  }

  if (config.max !== undefined && value > config.max) {
    return {
      field,
      message: `${field} must be less than or equal to ${config.max}.`,
    };
  }

  return null;
};

const validateStringLength = (field, value, config) => {
  if (isEmpty(value) || typeof value !== 'string') {
    return null;
  }

  if (config.min !== undefined && value.length < config.min) {
    return {
      field,
      message: `${field} must contain at least ${config.min} characters.`,
    };
  }

  if (config.max !== undefined && value.length > config.max) {
    return {
      field,
      message: `${field} must contain at most ${config.max} characters.`,
    };
  }

  return null;
};

const validatePattern = (field, value, pattern, message) => {
  if (isEmpty(value) || !pattern || pattern.test(value)) {
    return null;
  }

  return {
    field,
    message,
  };
};

const validateImageFile = (field, file, config) => {
  if (isEmpty(file)) {
    return null;
  }

  const mimeType = getFileMimeType(file);
  const fileSize = getFileSize(file);

  if (config.mimeTypes && !config.mimeTypes.includes(mimeType)) {
    return {
      field,
      message: `${field} must be one of these image types: ${config.mimeTypes.join(', ')}.`,
    };
  }

  if (config.maxSize && fileSize > config.maxSize) {
    return {
      field,
      message: `${field} must be smaller than ${config.maxSize} bytes.`,
    };
  }

  return null;
};

const validatePayload = (payload, schema, options = {}) => {
  const { partial = false } = options;
  const errors = [];
  const fieldNames = Object.keys(schema.fields);

  if (!partial) {
    errors.push(...validateRequiredFields(payload, schema.required || []));
  }

  fieldNames.forEach((field) => {
    if (partial && !(field in payload)) {
      return;
    }

    const config = schema.fields[field];
    const value = payload[field];
    const checks = [
      validateType(field, value, config.type),
      validateEnum(field, value, config.enum),
      validateRange(field, value, config),
      validateStringLength(field, value, config),
      validatePattern(field, value, config.pattern, config.patternMessage),
    ];

    if (config.image) {
      checks.push(validateImageFile(field, value, config.image));
    }

    errors.push(...checks.filter(Boolean));
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validatePayload,
  validateRequiredFields,
  validateImageFile,
};
