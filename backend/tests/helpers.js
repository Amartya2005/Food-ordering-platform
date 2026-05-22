/**
 * Test API helper functions for assertions and API calls
 */

const request = require('supertest');

/**
 * Creates a request with specified method and endpoint
 * @param {object} app - Express app instance
 * @param {string} method - HTTP method (get, post, put, patch, delete)
 * @param {string} endpoint - API endpoint path
 * @returns {object} Supertest request object
 */
const makeRequest = (app, method, endpoint) => {
  const methods = {
    get: app.get.bind(app),
    post: app.post.bind(app),
    put: app.put.bind(app),
    patch: app.patch.bind(app),
    delete: app.delete.bind(app),
  };

  return methods[method.toLowerCase()](endpoint);
};

/**
 * Adds authorization header to request
 * @param {object} req - Supertest request object
 * @param {string} token - JWT token
 * @returns {object} Request with auth header
 */
const withAuth = (req, token) => {
  return req.set('Authorization', `Bearer ${token}`);
};

/**
 * Asserts response is successful (success: true)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectSuccessResponse = (res) => {
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message');
  return res;
};

/**
 * Asserts response is an error (success: false)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectErrorResponse = (res) => {
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('message');
  return res;
};

/**
 * Asserts response is a validation error (400 with errors array)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectValidationError = (res) => {
  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body).toHaveProperty('errors');
  return res;
};

/**
 * Asserts response is unauthorized (401)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectAuthError = (res) => {
  expect(res.statusCode).toBe(401);
  expect(res.body.success).toBe(false);
  return res;
};

/**
 * Asserts response is forbidden (403)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectForbiddenError = (res) => {
  expect(res.statusCode).toBe(403);
  expect(res.body.success).toBe(false);
  return res;
};

/**
 * Asserts response is not found (404)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectNotFoundError = (res) => {
  expect(res.statusCode).toBe(404);
  expect(res.body.success).toBe(false);
  return res;
};

/**
 * Asserts response is internal server error (500)
 * @param {object} res - Response object
 * @returns {object} Response for chaining
 */
const expectInternalError = (res) => {
  expect(res.statusCode).toBe(500);
  expect(res.body.success).toBe(false);
  return res;
};

/**
 * Extracts data property from response
 * @param {object} res - Response object
 * @returns {*} Response data property
 */
const extractDataFromResponse = (res) => {
  return res.body.data;
};

module.exports = {
  makeRequest,
  withAuth,
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  expectAuthError,
  expectForbiddenError,
  expectNotFoundError,
  expectInternalError,
  extractDataFromResponse,
};
