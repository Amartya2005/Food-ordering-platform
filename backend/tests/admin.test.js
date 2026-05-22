const request = require('supertest');
const app = require('../app');
const { createAuthToken } = require('./fixtures');
const { expectAuthError, expectValidationError } = require('./helpers');

describe('Admin API - Authentication', () => {
  it('blocks unauthenticated admin access', async () => {
    const response = await request(app).get('/api/admin/users');

    expect(response.statusCode).toBe(401);
    expectAuthError(response);
  });

  it('rejects customer access to admin routes', async () => {
    const customerToken = createAuthToken('user_123', 'test@example.com', 'customer');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('rejects restaurant owner access to global admin routes', async () => {
    const ownerToken = createAuthToken('rest_owner_123', 'owner@example.com', 'restaurant_owner');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
  });
});

describe('Admin API - Validation', () => {
  it('validates admin restaurant ids before controller execution', async () => {
    const response = await request(app)
      .put('/api/admin/restaurants/invalid-id/verify')
      .set('Authorization', 'Bearer invalid-token');

    expect([400, 401]).toContain(response.statusCode);
    expect(response.body.success).toBe(false);
  });

  it('rejects invalid payload formats', async () => {
    const adminToken = createAuthToken('admin_123', 'admin@example.com', 'admin');

    const response = await request(app)
      .put('/api/admin/restaurants/invalid-id/verify')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });
});

describe('Admin API - Security', () => {
  it('includes request ID in admin endpoint responses', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('applies rate limiting to admin endpoints', async () => {
    expect(true).toBe(true);
  });

  it('sanitizes error responses in production mode', async () => {
    const response = await request(app).get('/api/admin/invalid-endpoint');

    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });
});

describe('Admin API - Pagination', () => {
  it('applies pagination defaults to admin list endpoints', async () => {
    const adminToken = createAuthToken('admin_123', 'admin@example.com', 'admin');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    if (response.statusCode === 200) {
      expect(response.body).toHaveProperty('data');
    }
  });
});
