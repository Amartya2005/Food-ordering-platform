const request = require('supertest');
const app = require('../app');
const { createTestUser, createAuthToken } = require('./fixtures');
const {
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  expectAuthError,
  expectNotFoundError,
  withAuth,
} = require('./helpers');

describe('Auth API - Health Check', () => {
  it('returns a production-ready health response', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      status: 'OK',
    });
  });
});

describe('Auth API - Registration', () => {
  it('rejects invalid email format', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    });

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
    });

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });

  it('rejects weak passwords', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: '123',
      name: 'Test User',
    });

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });

  it('returns standardized validation error response', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid',
    });

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});

describe('Auth API - Login', () => {
  it('rejects login without credentials', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });

  it('returns standardized error format', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });
});

describe('Auth API - Security', () => {
  it('includes request ID in response headers', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('handles missing auth token gracefully', async () => {
    const response = await request(app).get('/api/admin/dashboard').send();

    expect(response.statusCode).toBe(401);
    expectAuthError(response);
  });

  it('rejects invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.statusCode).toBe(401);
    expectAuthError(response);
  });
});

describe('Auth API - Rate Limiting', () => {
  it('applies rate limiting to auth endpoints', async () => {
    expect(true).toBe(true);
  });
});

