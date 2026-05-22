const BaseService = require('./base.service');
const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  USER_ROLES,
} = require('../../config/collections');
const { sanitizeOrder, sanitizeOrderList } = require('../../utils/orderHelpers');
const {
  emitOrderCreated,
  emitOrderStatusUpdated,
} = require('../realtime/orderRealtime.service');

class OrdersService extends BaseService {
  constructor() {
    super('orders');
  }

  async createOrder(payload, authenticatedUser) {
    const restaurant = await this._getRestaurantOrFail(payload.restaurantId);

    const validatedItems = await this._validateOrderItems(
      payload.restaurantId,
      payload.items,
    );

    const totalPrice = validatedItems.reduce(
      (sum, { menuItem, quantity }) => sum + menuItem.price * quantity,
      0,
    );
    const roundedTotal = Math.round(totalPrice * 100) / 100;

    const orderItems = validatedItems.map(({ menuItem, quantity }) => ({
      menuItemId: menuItem.id,
      itemName: menuItem.item_name,
      price: Number(menuItem.price),
      quantity,
    }));

    try {
      await this.execute(
        `INSERT INTO orders (customer_id, restaurant_id, items, total_price, status, payment_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          authenticatedUser.id,
          payload.restaurantId,
          JSON.stringify(orderItems),
          roundedTotal,
          ORDER_STATUSES.received,
          PAYMENT_STATUSES.pending,
        ],
      );

      const order = await this.queryOne(
        `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1`,
        [authenticatedUser.id],
      );

      const sanitized = sanitizeOrder(order);
      emitOrderCreated(sanitized);
      return sanitized;
    } catch (error) {
      throw this.handleError(error, 'Unable to create order.');
    }
  }

  async getOrderById(orderId, authenticatedUser) {
    const order = await this._getOrderOrFail(orderId);
    await this._assertOrderAccess(order, authenticatedUser);
    return sanitizeOrder(order);
  }

  async getCustomerOrders(authenticatedUser, query = {}) {
    const page = this._posInt(query.page, 1);
    const perPage = Math.min(this._posInt(query.perPage, 30), 100);
    const offset = (page - 1) * perPage;

    const conditions = [];
    const params = [];

    if (authenticatedUser.role !== USER_ROLES.admin) {
      conditions.push('customer_id = ?');
      params.push(authenticatedUser.id);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.queryOne(
      `SELECT COUNT(*) AS total FROM orders ${whereSql}`,
      params,
    );
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC ${pagination}`,
      params,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      orders: sanitizeOrderList(rows),
    };
  }

  async getRestaurantOrders(restaurantId, authenticatedUser, query = {}) {
    await this._verifyRestaurantOrderOwnership(restaurantId, authenticatedUser);

    const page = this._posInt(query.page, 1);
    const perPage = Math.min(this._posInt(query.perPage, 30), 100);
    const offset = (page - 1) * perPage;

    const conditions = ['restaurant_id = ?'];
    const params = [restaurantId];

    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const countRow = await this.queryOne(
      `SELECT COUNT(*) AS total FROM orders ${whereSql}`,
      params,
    );
    const totalItems = Number(countRow.total);

    const pagination = this.buildPaginationClause(perPage, offset);
    const rows = await this.query(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC ${pagination}`,
      params,
    );

    return {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      orders: sanitizeOrderList(rows),
    };
  }

  async updateOrderStatus(orderId, status) {
    try {
      await this.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
      const order = await this._getOrderOrFail(orderId);
      const sanitized = sanitizeOrder(order);
      emitOrderStatusUpdated(sanitized);
      return sanitized;
    } catch (error) {
      throw this.handleError(error, 'Unable to update order status.');
    }
  }

  async verifyOrderAccess(orderId, authenticatedUser) {
    const order = await this._getOrderOrFail(orderId);
    await this._assertOrderAccess(order, authenticatedUser);
    return sanitizeOrder(order);
  }

  async verifyOrderStatusManagement(orderId, authenticatedUser) {
    const order = await this._getOrderOrFail(orderId);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeOrder(order);
    }

    const restaurant = await this.queryOne(
      'SELECT owner_id FROM restaurants WHERE id = ?',
      [order.restaurant_id],
    );

    if (!restaurant || restaurant.owner_id !== authenticatedUser.id) {
      throw this.buildError(
        'You can only update statuses for orders from your own restaurants.',
        403,
      );
    }

    return sanitizeOrder(order);
  }

  async verifyRestaurantOrderOwnership(restaurantId, authenticatedUser) {
    return this._verifyRestaurantOrderOwnership(restaurantId, authenticatedUser);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  async _getOrderOrFail(orderId) {
    const order = await this.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) {
      throw this.buildError('Order not found.', 404);
    }

    // Parse JSON items if stored as string
    if (typeof order.items === 'string') {
      order.items = JSON.parse(order.items);
    }

    return order;
  }

  async _getRestaurantOrFail(restaurantId) {
    const restaurant = await this.queryOne(
      'SELECT id, owner_id FROM restaurants WHERE id = ?',
      [restaurantId],
    );

    if (!restaurant) {
      throw this.buildError('Restaurant not found.', 404);
    }

    return restaurant;
  }

  async _validateOrderItems(restaurantId, items) {
    const validated = [];

    for (const item of items) {
      const menuItem = await this.queryOne(
        'SELECT * FROM menu_items WHERE id = ?',
        [item.menuItemId],
      );

      if (!menuItem) {
        throw this.buildError('Menu item not found.', 404);
      }

      if (menuItem.restaurant_id !== restaurantId) {
        throw this.buildError(
          'All menu items must belong to the selected restaurant.',
          400,
          [{ field: 'items', message: `Menu item ${item.menuItemId} does not belong to restaurant ${restaurantId}.` }],
        );
      }

      if (!menuItem.availability) {
        throw this.buildError(
          'Unavailable menu items cannot be ordered.',
          400,
          [{ field: 'items', message: `Menu item ${item.menuItemId} is unavailable.` }],
        );
      }

      validated.push({ menuItem, quantity: item.quantity });
    }

    return validated;
  }

  async _assertOrderAccess(order, authenticatedUser) {
    if (authenticatedUser.role === USER_ROLES.admin) return;

    if (
      authenticatedUser.role === USER_ROLES.customer &&
      order.customer_id === authenticatedUser.id
    ) {
      return;
    }

    if (authenticatedUser.role === USER_ROLES.restaurantOwner) {
      const restaurant = await this.queryOne(
        'SELECT owner_id FROM restaurants WHERE id = ?',
        [order.restaurant_id],
      );

      if (restaurant && restaurant.owner_id === authenticatedUser.id) return;
    }

    throw this.buildError('You do not have permission to access this order.', 403);
  }

  async _verifyRestaurantOrderOwnership(restaurantId, authenticatedUser) {
    const restaurant = await this._getRestaurantOrFail(restaurantId);

    if (authenticatedUser.role === USER_ROLES.admin) return restaurant;

    if (restaurant.owner_id !== authenticatedUser.id) {
      throw this.buildError('You can only access orders for your own restaurants.', 403);
    }

    return restaurant;
  }

  _posInt(value, fallback) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 ? n : fallback;
  }
}

module.exports = new OrdersService();
