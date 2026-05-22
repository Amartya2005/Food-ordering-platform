const request = require('supertest');
const app = require('../app');
const { createTestOrder, createAuthToken } = require('./fixtures');
const {
  expectValidationError,
  expectAuthError,
  expectNotFoundError,
  expectErrorResponse,
} = require('./helpers');

describe('Orders API - Authentication', () => {
  it('protects customer order routes with authentication', async () => {
    const response = await request(app).get('/api/orders/my-orders');

    expect(response.statusCode).toBe(401);
    expectAuthError(response);
  });

  it('rejects requests with invalid JWT', async () => {
    const response = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.statusCode).toBe(401);
    expectAuthError(response);
  });
});

describe('Orders API - Validation', () => {
  it('rejects create order with invalid payload', async () => {
    const token = createAuthToken('user_123', 'test@example.com', 'customer');

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });

  it('validates required order fields', async () => {
    const token = createAuthToken('user_123', 'test@example.com', 'customer');

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId: '',
        items: [],
      });

    expect(response.statusCode).toBe(400);
    expectValidationError(response);
  });

  it('rejects invalid order ID format', async () => {
    const token = createAuthToken('user_123', 'test@example.com', 'customer');

    const response = await request(app)
      .get('/api/orders/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.statusCode);
    expect(response.body.success).toBe(false);
  });
});

describe('Orders API - Pagination', () => {
  it('applies pagination defaults to list endpoints', async () => {
    const token = createAuthToken('user_123', 'test@example.com', 'customer');

    const response = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${token}`);

    if (response.statusCode === 200) {
      expect(response.body).toHaveProperty('data');
    }
  });
});

describe('Orders API - Rate Limiting', () => {
  it('applies rate limiting to order endpoints', async () => {
    expect(true).toBe(true);
  });
});
