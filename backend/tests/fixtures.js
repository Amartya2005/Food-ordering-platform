/**
 * Test fixtures and test data builders for unit and integration tests
 */

const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const DEFAULT_JWT_SECRET = 'test-jwt-secret';
const DEFAULT_SALT_ROUNDS = 10;

/**
 * Generates a JWT token for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role (default: 'customer')
 * @param {string} secret - JWT secret (default: test-jwt-secret)
 * @returns {string} JWT token
 */
const generateTokenForUser = (userId, email, role = 'customer', secret = DEFAULT_JWT_SECRET) => {
  return jwt.sign({ id: userId, email, role }, secret, {
    expiresIn: '24h',
  });
};

/**
 * Hashes a password using bcrypt
 * @param {string} password - Password to hash
 * @param {number} saltRounds - Salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = DEFAULT_SALT_ROUNDS) => {
  return bcryptjs.hash(password, saltRounds);
};

/**
 * Verifies a password against its hash
 * @param {string} password - Password to verify
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} True if password matches hash
 */
const verifyPassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

/**
 * Creates a test user object with optional overrides
 * @param {object} overrides - Properties to override defaults
 * @returns {object} Test user object
 */
const createTestUser = (overrides = {}) => {
  const defaults = {
    id: 'user_' + Math.random().toString(36).substring(7),
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer',
    phone: '+1234567890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates a test restaurant object with optional overrides
 * @param {object} overrides - Properties to override defaults
 * @returns {object} Test restaurant object
 */
const createTestRestaurant = (overrides = {}) => {
  const defaults = {
    id: 'rest_' + Math.random().toString(36).substring(7),
    name: 'Test Restaurant',
    ownerId: 'user_' + Math.random().toString(36).substring(7),
    description: 'A test restaurant',
    address: '123 Test Street',
    city: 'Test City',
    phone: '+1234567890',
    image: null,
    rating: 4.5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates a test menu item object with optional overrides
 * @param {string} restaurantId - Restaurant ID for this menu item
 * @param {object} overrides - Properties to override defaults
 * @returns {object} Test menu item object
 */
const createTestMenu = (restaurantId, overrides = {}) => {
  const defaults = {
    id: 'menu_' + Math.random().toString(36).substring(7),
    restaurantId,
    name: 'Test Menu Item',
    description: 'A test menu item',
    price: 9.99,
    category: 'Main Course',
    image: null,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates a test order object with optional overrides
 * @param {string} customerId - Customer ID
 * @param {string} restaurantId - Restaurant ID
 * @param {object} overrides - Properties to override defaults
 * @returns {object} Test order object
 */
const createTestOrder = (customerId, restaurantId, overrides = {}) => {
  const defaults = {
    id: 'order_' + Math.random().toString(36).substring(7),
    customerId,
    restaurantId,
    items: [
      {
        menuId: 'menu_' + Math.random().toString(36).substring(7),
        quantity: 1,
        price: 9.99,
      },
    ],
    totalAmount: 9.99,
    status: 'pending',
    deliveryAddress: '456 Customer Street',
    specialInstructions: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates an auth token for testing (alias for generateTokenForUser)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const createAuthToken = (userId, email, role = 'customer') => {
  return generateTokenForUser(userId, email, role);
};

module.exports = {
  generateTokenForUser,
  hashPassword,
  verifyPassword,
  createTestUser,
  createTestRestaurant,
  createTestMenu,
  createTestOrder,
  createAuthToken,
};
