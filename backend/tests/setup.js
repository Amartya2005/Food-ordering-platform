process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.CLIENT_URLS = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = 'food_ordering_test';
process.env.DB_CHECK_ON_STARTUP = 'false';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.AUTH_RATE_LIMIT_MAX = '200';
process.env.ADMIN_RATE_LIMIT_MAX = '500';
process.env.ORDER_RATE_LIMIT_MAX = '500';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
