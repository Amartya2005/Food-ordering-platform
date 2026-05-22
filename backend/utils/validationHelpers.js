/**
 * Reusable validation helpers for consistent input validation across the API.
 * All functions return boolean - true if valid, false if invalid.
 */

/**
 * Validates email format using regex pattern
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets minimum requirements
 */
const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 6) {
    return false;
  }
  return true;
};

/**
 * Validates string value with configurable constraints
 * @param {string} value - String to validate
 * @param {object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 1)
 * @param {number} options.maxLength - Maximum length (default: 500)
 * @param {boolean} options.required - Whether value is required (default: true)
 * @returns {boolean} True if valid
 */
const validateString = (value, options = {}) => {
  const { minLength = 1, maxLength = 500, required = true } = options;

  if (required && (!value || typeof value !== 'string' || value.trim() === '')) {
    return false;
  }

  if (value && typeof value !== 'string') {
    return false;
  }

  if (value && (value.length < minLength || value.length > maxLength)) {
    return false;
  }

  return true;
};

/**
 * Validates numeric value with range constraints
 * @param {number} value - Number to validate
 * @param {object} options - Validation options
 * @param {number} options.min - Minimum value (default: 0)
 * @param {number} options.max - Maximum value (default: Infinity)
 * @param {boolean} options.required - Whether value is required (default: true)
 * @returns {boolean} True if valid
 */
const validateNumber = (value, options = {}) => {
  const { min = 0, max = Infinity, required = true } = options;

  if (required && value === undefined && value === null) {
    return false;
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return false;
  }

  if (num < min || num > max) {
    return false;
  }

  return true;
};

/**
 * Validates that value is one of allowed enumeration values
 * @param {*} value - Value to validate
 * @param {array} allowedValues - Array of allowed values
 * @returns {boolean} True if value is in allowedValues
 */
const validateEnumValue = (value, allowedValues) => {
  if (!Array.isArray(allowedValues)) {
    return false;
  }

  return allowedValues.includes(value);
};

/**
 * Validates phone number format (basic international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(String(phone).replace(/\s/g, ''));
};

/**
 * Validates URL format using URL constructor
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates pagination parameters
 * @param {number|string} limit - Items per page
 * @param {number|string} offset - Page offset
 * @returns {boolean} True if valid pagination params
 */
const validatePagination = (limit, offset) => {
  const parsedLimit = Number(limit);
  const parsedOffset = Number(offset);

  if (Number.isNaN(parsedLimit) || Number.isNaN(parsedOffset)) {
    return false;
  }

  if (parsedLimit < 1 || parsedLimit > 1000) {
    return false;
  }

  if (parsedOffset < 0) {
    return false;
  }

  return true;
};

/**
 * Validates sort parameter against allowed fields
 * @param {string} sortField - Sort field with optional '-' prefix for DESC
 * @param {array} allowedFields - Array of allowed field names
 * @returns {boolean} True if valid sort
 */
const validateSort = (sortField, allowedFields) => {
  if (!sortField) {
    return true;
  }

  const field = sortField.startsWith('-') ? sortField.substring(1) : sortField;

  return allowedFields.includes(field);
};

/** MySQL UUID primary keys (CHAR(36)) */
const RECORD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates record UUID format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid UUID format
 */
const validateRecordId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  return RECORD_ID_PATTERN.test(id);
};

/**
 * @deprecated Use validateRecordId
 */
const validateId = validateRecordId;

/**
 * Validates MongoDB-style ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  return /^[a-z0-9]{8,}$/.test(id);
};

module.exports = {
  RECORD_ID_PATTERN,
  validateEmail,
  validatePassword,
  validateString,
  validateNumber,
  validateEnumValue,
  validatePhone,
  validateUrl,
  validatePagination,
  validateSort,
  validateRecordId,
  validateId,
  validateObjectId,
};
