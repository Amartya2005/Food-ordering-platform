const BaseService = require('./base.service');
const { USER_ROLES } = require('../../config/collections');
const { sanitizeRestaurant, sanitizeRestaurantList } = require('../../utils/restaurantHelpers');
const { resolveUploadedImageUrl } = require('../../utils/uploadHelpers');

class RestaurantsService extends BaseService {
  constructor() {
    super('restaurants');
  }

  async createRestaurant(payload, imageFile, authenticatedUser) {
    const imageUrl = resolveUploadedImageUrl(imageFile);

    try {
      await this.execute(
        `INSERT INTO restaurants (owner_id, name, category, location, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [
          authenticatedUser.id,
          payload.name.trim(),
          payload.category.trim(),
          payload.location.trim(),
          imageUrl,
        ],
      );

      const restaurant = await this.queryOne(
        `SELECT * FROM restaurants WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1`,
        [authenticatedUser.id],
      );

      return sanitizeRestaurant(restaurant);
    } catch (error) {
      throw this.handleError(error, 'Unable to create restaurant.');
    }
  }

  async getRestaurants(query = {}) {
    const page = this._posInt(query.page, 1);
    const perPage = Math.min(this._posInt(query.perPage, 20), 50);
    const offset = (page - 1) * perPage;

    const { whereSql, params } = this._buildRestaurantWhere(query);

    const countRow = await this.queryOne(
      `SELECT COUNT(*) AS total FROM restaurants ${whereSql}`,
      params,
    );
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM restaurants ${whereSql} ORDER BY created_at DESC ${pagination}`,
      params,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      restaurants: sanitizeRestaurantList(rows),
    };
  }

  async getRestaurantById(restaurantId) {
    const restaurant = await this.queryOne(
      'SELECT * FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    return sanitizeRestaurant(restaurant);
  }

  async getRestaurantRecordById(restaurantId) {
    const restaurant = await this.queryOne(
      'SELECT * FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    return restaurant;
  }

  async updateRestaurant(restaurantId, payload, imageFile) {
    const fields = [];
    const params = [];

    if (payload.name !== undefined) {
      fields.push('name = ?');
      params.push(payload.name.trim());
    }

    if (payload.category !== undefined) {
      fields.push('category = ?');
      params.push(payload.category.trim());
    }

    if (payload.location !== undefined) {
      fields.push('location = ?');
      params.push(payload.location.trim());
    }

    if (imageFile) {
      fields.push('image_url = ?');
      params.push(resolveUploadedImageUrl(imageFile));
    }

    if (fields.length === 0) {
      throw this.buildError('No fields to update.', 400);
    }

    params.push(restaurantId);

    try {
      await this.execute(
        `UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );

      return this.getRestaurantById(restaurantId);
    } catch (error) {
      throw this.handleError(error, 'Unable to update restaurant.');
    }
  }

  async deleteRestaurant(restaurantId) {
    try {
      await this.execute('DELETE FROM restaurants WHERE id = ?', [restaurantId]);
      return true;
    } catch (error) {
      throw this.handleError(error, 'Unable to delete restaurant.');
    }
  }

  async verifyRestaurantOwnership(restaurantId, authenticatedUser) {
    if (!authenticatedUser) {
      throw this.buildError('Authentication is required.', 401);
    }

    const restaurant = await this.getRestaurantRecordById(restaurantId);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeRestaurant(restaurant);
    }

    if (restaurant.owner_id !== authenticatedUser.id) {
      throw this.buildError('You can only manage your own restaurants.', 403);
    }

    return sanitizeRestaurant(restaurant);
  }

  _buildRestaurantWhere(query) {
    const conditions = [];
    const params = [];

    if (query.category) {
      conditions.push('category LIKE ?');
      params.push(`%${query.category.trim()}%`);
    }

    if (query.location) {
      conditions.push('location LIKE ?');
      params.push(`%${query.location.trim()}%`);
    }

    if (query.search) {
      conditions.push('(name LIKE ? OR category LIKE ? OR location LIKE ?)');
      const term = `%${query.search.trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereSql, params };
  }

  _posInt(value, fallback) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 ? n : fallback;
  }
}

module.exports = new RestaurantsService();
