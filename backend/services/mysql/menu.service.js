const BaseService = require('./base.service');
const { USER_ROLES } = require('../../config/collections');
const { sanitizeMenuItem, sanitizeMenuItemList } = require('../../utils/menuHelpers');
const { resolveUploadedImageUrl } = require('../../utils/uploadHelpers');

class MenuService extends BaseService {
  constructor() {
    super('menu_items');
  }

  async createMenuItem(payload, imageFile, authenticatedUser) {
    await this._verifyRestaurantAccess(payload.restaurantId, authenticatedUser);

    const imageUrl = resolveUploadedImageUrl(imageFile);

    try {
      await this.execute(
        `INSERT INTO menu_items (restaurant_id, item_name, price, image_url, availability)
         VALUES (?, ?, ?, ?, ?)`,
        [
          payload.restaurantId,
          payload.itemName.trim(),
          payload.price,
          imageUrl,
          payload.availability !== false ? 1 : 0,
        ],
      );

      const menuItem = await this.queryOne(
        `SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 1`,
        [payload.restaurantId],
      );

      return sanitizeMenuItem(menuItem);
    } catch (error) {
      throw this.handleError(error, 'Unable to create menu item.');
    }
  }

  async getRestaurantMenu(restaurantId, query = {}) {
    // Ensure restaurant exists
    const restaurant = await this.queryOne(
      'SELECT id FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    const page = this._posInt(query.page, 1);
    const perPage = Math.min(this._posInt(query.perPage, 50), 100);
    const offset = (page - 1) * perPage;

    const conditions = ['restaurant_id = ?'];
    const params = [restaurantId];

    if (query.availability !== undefined) {
      const avail = this._parseAvailability(query.availability);

      if (avail !== null) {
        conditions.push('availability = ?');
        params.push(avail ? 1 : 0);
      }
    }

    if (query.search) {
      conditions.push('item_name LIKE ?');
      params.push(`%${query.search.trim()}%`);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const countRow = await this.queryOne(
      `SELECT COUNT(*) AS total FROM menu_items ${whereSql}`,
      params,
    );
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM menu_items ${whereSql} ORDER BY item_name ASC ${pagination}`,
      params,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      menuItems: sanitizeMenuItemList(rows),
    };
  }

  async updateMenuItem(menuItemId, payload, imageFile) {
    const fields = [];
    const params = [];

    if (payload.itemName !== undefined) {
      fields.push('item_name = ?');
      params.push(payload.itemName.trim());
    }

    if (payload.price !== undefined) {
      fields.push('price = ?');
      params.push(payload.price);
    }

    if (payload.availability !== undefined) {
      fields.push('availability = ?');
      params.push(payload.availability ? 1 : 0);
    }

    if (imageFile) {
      fields.push('image_url = ?');
      params.push(resolveUploadedImageUrl(imageFile));
    }

    if (fields.length === 0) {
      throw this.buildError('No fields to update.', 400);
    }

    params.push(menuItemId);

    try {
      await this.execute(
        `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );

      return this.getMenuItemById(menuItemId);
    } catch (error) {
      throw this.handleError(error, 'Unable to update menu item.');
    }
  }

  async deleteMenuItem(menuItemId) {
    try {
      await this.execute('DELETE FROM menu_items WHERE id = ?', [menuItemId]);
      return true;
    } catch (error) {
      throw this.handleError(error, 'Unable to delete menu item.');
    }
  }

  async toggleAvailability(menuItemId, availability) {
    let nextAvailability = availability;

    if (nextAvailability === undefined) {
      const current = await this.getMenuItemRecordById(menuItemId);
      nextAvailability = !current.availability;
    }

    try {
      await this.execute(
        'UPDATE menu_items SET availability = ? WHERE id = ?',
        [nextAvailability ? 1 : 0, menuItemId],
      );

      return this.getMenuItemById(menuItemId);
    } catch (error) {
      throw this.handleError(error, 'Unable to update menu availability.');
    }
  }

  async verifyMenuOwnership(menuItemId, authenticatedUser) {
    if (!authenticatedUser) {
      throw this.buildError('Authentication is required.', 401);
    }

    const menuItem = await this.getMenuItemRecordById(menuItemId);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeMenuItem(menuItem);
    }

    const restaurant = await this.queryOne(
      'SELECT owner_id FROM restaurants WHERE id = ?',
      [menuItem.restaurant_id],
    );

    if (!restaurant || restaurant.owner_id !== authenticatedUser.id) {
      throw this.buildError('You can only manage menu items for your own restaurants.', 403);
    }

    return sanitizeMenuItem(menuItem);
  }

  async getMenuItemById(menuItemId) {
    const menuItem = await this.queryOne(
      'SELECT * FROM menu_items WHERE id = ?',
      [menuItemId],
    );

    if (!menuItem) {
      throw this.buildError('Menu item not found.', 404);
    }

    return sanitizeMenuItem(menuItem);
  }

  async getMenuItemRecordById(menuItemId) {
    const menuItem = await this.queryOne(
      'SELECT * FROM menu_items WHERE id = ?',
      [menuItemId],
    );

    if (!menuItem) {
      throw this.buildError('Menu item not found.', 404);
    }

    return menuItem;
  }

  async _verifyRestaurantAccess(restaurantId, authenticatedUser) {
    if (!authenticatedUser) {
      throw this.buildError('Authentication is required.', 401);
    }

    const restaurant = await this.queryOne(
      'SELECT id, owner_id FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    if (authenticatedUser.role === USER_ROLES.admin) {
      return restaurant;
    }

    if (restaurant.owner_id !== authenticatedUser.id) {
      throw this.buildError('You can only create menu items for your own restaurants.', 403);
    }

    return restaurant;
  }

  _parseAvailability(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'off'].includes(v)) return false;
    return null;
  }

  _posInt(value, fallback) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 ? n : fallback;
  }
}

module.exports = new MenuService();
