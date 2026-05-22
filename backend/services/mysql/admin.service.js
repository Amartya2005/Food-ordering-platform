const BaseService = require('./base.service');
const { buildAnalyticsOverview } = require('../../utils/analyticsHelpers');
const { sanitizeAdminUserList, sanitizeAdminRestaurant, sanitizeAdminRestaurantList, normalizePaginationQuery } = require('../../utils/adminHelpers');

class AdminService extends BaseService {
  constructor() {
    super('users');
  }

  async getAllUsers(query = {}) {
    const { page, perPage } = normalizePaginationQuery(query);
    const offset = (page - 1) * perPage;

    const countRow = await this.queryOne('SELECT COUNT(*) AS total FROM users');
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM users ORDER BY created_at DESC ${pagination}`,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      users: sanitizeAdminUserList(rows),
    };
  }

  async deleteUser(userId, authenticatedUser) {
    if (authenticatedUser.id === userId) {
      throw this.buildError('Admin self-deletion is not allowed.', 400);
    }

    const user = await this.queryOne('SELECT id FROM users WHERE id = ?', [userId]);

    if (!user) {
      throw this.buildError('User not found.', 404);
    }

    try {
      await this.execute('DELETE FROM users WHERE id = ?', [userId]);
      return true;
    } catch (error) {
      throw this.handleError(error, 'Unable to delete user.');
    }
  }

  async getAllRestaurants(query = {}) {
    const { page, perPage } = normalizePaginationQuery(query);
    const offset = (page - 1) * perPage;

    const countRow = await this.queryOne('SELECT COUNT(*) AS total FROM restaurants');
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM restaurants ORDER BY created_at DESC ${pagination}`,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      restaurants: sanitizeAdminRestaurantList(rows),
    };
  }

  async verifyRestaurant(restaurantId) {
    const restaurant = await this.queryOne(
      'SELECT id FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    try {
      await this.execute(
        'UPDATE restaurants SET is_verified = 1 WHERE id = ?',
        [restaurantId],
      );

      const updated = await this.queryOne(
        'SELECT * FROM restaurants WHERE id = ?',
        [restaurantId],
      );

      return sanitizeAdminRestaurant(updated);
    } catch (error) {
      throw this.handleError(error, 'Unable to verify restaurant.');
    }
  }

  async deleteRestaurant(restaurantId) {
    const restaurant = await this.queryOne(
      'SELECT id FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    try {
      await this.execute('DELETE FROM restaurants WHERE id = ?', [restaurantId]);
      return true;
    } catch (error) {
      throw this.handleError(error, 'Unable to delete restaurant.');
    }
  }

  async getAnalyticsOverview() {
    try {
      const [usersRow, restaurantsRow, ordersRow, users, orders] = await Promise.all([
        this.queryOne('SELECT COUNT(*) AS total FROM users'),
        this.queryOne('SELECT COUNT(*) AS total FROM restaurants'),
        this.queryOne('SELECT COUNT(*) AS total FROM orders'),
        this.query('SELECT id, role, created_at AS created FROM users'),
        this.query('SELECT id, status, total_price AS totalPrice, created_at AS created FROM orders ORDER BY created_at DESC'),
      ]);

      return buildAnalyticsOverview({
        usersTotal: Number(usersRow.total),
        restaurantsTotal: Number(restaurantsRow.total),
        ordersTotal: Number(ordersRow.total),
        users,
        orders,
      });
    } catch (error) {
      throw this.handleError(error, 'Unable to retrieve analytics overview.');
    }
  }
}

module.exports = new AdminService();
