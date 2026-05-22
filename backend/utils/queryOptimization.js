/**
 * Query optimization and response data handling utilities
 */

/**
 * Removes sensitive fields from response data
 * @param {object|array} data - Data to sanitize
 * @param {array} sensitiveFields - Additional fields to remove beyond defaults
 * @returns {object|array} Sanitized data with sensitive fields removed
 */
const sanitizeResponseData = (data, sensitiveFields = []) => {
  if (!data) {
    return data;
  }

  const defaultSensitiveFields = ['password', 'jwt_secret', 'api_key', 'secret'];
  const fieldsToRemove = [...defaultSensitiveFields, ...sensitiveFields];

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSingleItem(item, fieldsToRemove));
  }

  return sanitizeSingleItem(data, fieldsToRemove);
};

/**
 * Sanitizes a single object by removing sensitive fields
 * @param {object} item - Item to sanitize
 * @param {array} fieldsToRemove - Fields to remove
 * @returns {object} Sanitized item
 */
const sanitizeSingleItem = (item, fieldsToRemove = []) => {
  if (typeof item !== 'object' || item === null) {
    return item;
  }

  const sanitized = { ...item };

  fieldsToRemove.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
};

/**
 * Builds field selection array for efficient queries
 * @param {array} baseFields - Fields to include
 * @returns {array} Merged with default fields (id, created, updated)
 */
const buildSelectFields = (baseFields = []) => {
  const defaultFields = ['id', 'created', 'updated'];
  return Array.from(new Set([...defaultFields, ...baseFields]));
};

/**
 * Builds filtered query object based on allowed fields
 * @param {object} filters - Raw filter object from request
 * @param {array} allowedFields - Fields that can be filtered
 * @returns {object} Filtered query object
 */
const buildFilterQuery = (filters = {}, allowedFields = []) => {
  const query = {};

  Object.keys(filters).forEach((key) => {
    if (allowedFields.includes(key)) {
      query[key] = filters[key];
    }
  });

  return query;
};

/**
 * Parses sort parameter into field and direction
 * @param {string} sortString - Sort string (e.g., '-created' for DESC)
 * @returns {object} {field, direction} object
 */
const parseSort = (sortString = '-created') => {
  if (!sortString) {
    return { field: 'created', direction: 'DESC' };
  }

  const isDescending = sortString.startsWith('-');
  const field = isDescending ? sortString.substring(1) : sortString;
  const direction = isDescending ? 'DESC' : 'ASC';

  return { field, direction };
};

/**
 * Normalizes pagination parameters to valid values
 * @param {number|string} limit - Items per page
 * @param {number|string} offset - Page offset
 * @returns {object} {limit, offset} with safe defaults
 */
const buildPaginationParams = (limit, offset) => {
  return {
    limit: Math.min(Math.max(Number(limit) || 10, 1), 100),
    offset: Math.max(Number(offset) || 0, 0),
  };
};

module.exports = {
  sanitizeResponseData,
  sanitizeSingleItem,
  buildSelectFields,
  buildFilterQuery,
  parseSort,
  buildPaginationParams,
};
