const BasePocketBaseService = require('./base.service');
const env = require('../../config/env');
const {
  COLLECTION_NAMES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  USER_ROLES,
} = require('../../config/collections');
const { createPocketBaseClient } = require('../../config/pocketbase');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');
const { sanitizeOrder, sanitizeOrderList } = require('../../utils/orderHelpers');
const {
  emitOrderCreated,
  emitOrderStatusUpdated,
} = require('../realtime/orderRealtime.service');

class OrdersService extends BasePocketBaseService {
  constructor() {
    super(COLLECTION_NAMES.orders);
    this.serverClient = null;
  }

  async createOrder(payload, authenticatedUser) {
    const client = await this.getServerClient();

    await this.getRestaurantRecordById(payload.restaurantId, client);

    const validatedItems = await this.validateOrderItems(
      payload.restaurantId,
      payload.items,
      client,
    );
    const totalPrice = this.calculateOrderTotal(validatedItems);
    const orderItems = payload.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    }));

    try {
      const order = await client.collection(this.collectionName).create(
        {
          customerId: authenticatedUser.id,
          restaurantId: payload.restaurantId,
          items: orderItems,
          totalPrice,
          status: ORDER_STATUSES.received,
          paymentStatus: PAYMENT_STATUSES.pending,
        },
        {
          requestKey: null,
        },
      );

      const sanitizedOrder = sanitizeOrder(order);

      emitOrderCreated(sanitizedOrder);

      return sanitizedOrder;
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to create order.');
    }
  }

  async getOrderById(orderId, authenticatedUser) {
    const client = await this.getServerClient();
    const order = await this.getOrderRecordById(orderId, client, {
      expand: 'restaurantId',
    });

    await this.assertOrderAccess(order, authenticatedUser, client);

    return sanitizeOrder(order);
  }

  async getCustomerOrders(authenticatedUser, query = {}) {
    const client = await this.getServerClient();
    const page = this.normalizePositiveInteger(query.page, 1);
    const perPage = Math.min(this.normalizePositiveInteger(query.perPage, 30), 100);
    const options = {
      sort: query.sort || '-created',
      requestKey: null,
    };

    if (authenticatedUser.role !== USER_ROLES.admin) {
      options.filter = client.filter('customerId = {:customerId}', {
        customerId: authenticatedUser.id,
      });
    }

    try {
      const result = await client.collection(this.collectionName).getList(page, perPage, options);

      return {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        orders: sanitizeOrderList(result.items),
      };
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to retrieve customer orders.');
    }
  }

  async getRestaurantOrders(restaurantId, authenticatedUser, query = {}) {
    const client = await this.getServerClient();

    await this.verifyRestaurantOrderOwnership(restaurantId, authenticatedUser, client);

    const page = this.normalizePositiveInteger(query.page, 1);
    const perPage = Math.min(this.normalizePositiveInteger(query.perPage, 30), 100);
    const filterParts = ['restaurantId = {:restaurantId}'];
    const params = {
      restaurantId,
    };

    if (query.status) {
      filterParts.push('status = {:status}');
      params.status = query.status;
    }

    const options = {
      sort: query.sort || '-created',
      filter: client.filter(filterParts.join(' && '), params),
      requestKey: null,
    };

    try {
      const result = await client.collection(this.collectionName).getList(page, perPage, options);

      return {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        orders: sanitizeOrderList(result.items),
      };
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to retrieve restaurant orders.');
    }
  }

  async updateOrderStatus(orderId, status) {
    const client = await this.getServerClient();

    try {
      const order = await client.collection(this.collectionName).update(
        orderId,
        {
          status,
        },
        {
          requestKey: null,
        },
      );

      const sanitizedOrder = sanitizeOrder(order);

      emitOrderStatusUpdated(sanitizedOrder);

      return sanitizedOrder;
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to update order status.');
    }
  }

  calculateOrderTotal(validatedItems) {
    const total = validatedItems.reduce((runningTotal, item) => {
      return runningTotal + item.menuItem.price * item.quantity;
    }, 0);

    return Math.round(total * 100) / 100;
  }

  async validateOrderItems(restaurantId, items, client) {
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await this.getMenuItemRecordById(item.menuItemId, client);

      if (menuItem.restaurantId !== restaurantId) {
        const error = new Error('All menu items must belong to the selected restaurant.');
        error.statusCode = 400;
        error.details = [
          {
            field: 'items',
            message: `Menu item ${item.menuItemId} does not belong to restaurant ${restaurantId}.`,
          },
        ];
        throw error;
      }

      if (!menuItem.availability) {
        const error = new Error('Unavailable menu items cannot be ordered.');
        error.statusCode = 400;
        error.details = [
          {
            field: 'items',
            message: `Menu item ${item.menuItemId} is unavailable.`,
          },
        ];
        throw error;
      }

      validatedItems.push({
        menuItem,
        quantity: item.quantity,
      });
    }

    return validatedItems;
  }

  async verifyRestaurantOrderOwnership(restaurantId, authenticatedUser, client = null) {
    const activeClient = client || (await this.getServerClient());
    const restaurant = await this.getRestaurantRecordById(restaurantId, activeClient);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return restaurant;
    }

    if (restaurant.ownerId !== authenticatedUser.id) {
      const error = new Error('You can only access orders for your own restaurants.');
      error.statusCode = 403;
      throw error;
    }

    return restaurant;
  }

  async verifyOrderAccess(orderId, authenticatedUser) {
    const client = await this.getServerClient();
    const order = await this.getOrderRecordById(orderId, client, {
      expand: 'restaurantId',
    });

    await this.assertOrderAccess(order, authenticatedUser, client);

    return sanitizeOrder(order);
  }

  async verifyOrderStatusManagement(orderId, authenticatedUser) {
    const client = await this.getServerClient();
    const order = await this.getOrderRecordById(orderId, client, {
      expand: 'restaurantId',
    });

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeOrder(order);
    }

    const restaurant = order.expand && order.expand.restaurantId
      ? order.expand.restaurantId
      : await this.getRestaurantRecordById(order.restaurantId, client);

    if (restaurant.ownerId !== authenticatedUser.id) {
      const error = new Error('You can only update statuses for orders from your own restaurants.');
      error.statusCode = 403;
      throw error;
    }

    return sanitizeOrder(order);
  }

  async assertOrderAccess(order, authenticatedUser, client) {
    if (authenticatedUser.role === USER_ROLES.admin) {
      return;
    }

    if (authenticatedUser.role === USER_ROLES.customer && order.customerId === authenticatedUser.id) {
      return;
    }

    if (authenticatedUser.role === USER_ROLES.restaurantOwner) {
      const restaurant = order.expand && order.expand.restaurantId
        ? order.expand.restaurantId
        : await this.getRestaurantRecordById(order.restaurantId, client);

      if (restaurant.ownerId === authenticatedUser.id) {
        return;
      }
    }

    const error = new Error('You do not have permission to access this order.');
    error.statusCode = 403;
    throw error;
  }

  async getOrderRecordById(orderId, client, options = {}) {
    try {
      return await client.collection(this.collectionName).getOne(orderId, {
        requestKey: null,
        ...options,
      });
    } catch (error) {
      throw this.handleNotFoundError(error, 'Order not found.');
    }
  }

  async getRestaurantRecordById(restaurantId, client) {
    try {
      return await client.collection(COLLECTION_NAMES.restaurants).getOne(restaurantId, {
        requestKey: null,
      });
    } catch (error) {
      throw this.handleNotFoundError(error, 'Restaurant not found.');
    }
  }

  async getMenuItemRecordById(menuItemId, client) {
    try {
      return await client.collection(COLLECTION_NAMES.menuItems).getOne(menuItemId, {
        requestKey: null,
      });
    } catch (error) {
      throw this.handleNotFoundError(error, 'Menu item not found.');
    }
  }

  normalizePositiveInteger(value, fallback) {
    const number = Number(value);

    if (!Number.isInteger(number) || number < 1) {
      return fallback;
    }

    return number;
  }

  async getServerClient() {
    if (this.serverClient && this.serverClient.authStore.isValid) {
      return this.serverClient;
    }

    if (!env.pocketbase.superuserEmail || !env.pocketbase.superuserPassword) {
      const error = new Error(
        'PocketBase superuser credentials are required for protected order operations.',
      );
      error.statusCode = 500;
      throw error;
    }

    this.serverClient = createPocketBaseClient();

    await this.serverClient
      .collection('_superusers')
      .authWithPassword(env.pocketbase.superuserEmail, env.pocketbase.superuserPassword, {
        requestKey: null,
      });

    return this.serverClient;
  }

  handleNotFoundError(error, message) {
    const normalizedError = normalizePocketBaseError(error);

    if (normalizedError.status === 404) {
      const notFoundError = new Error(message);
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    throw this.handleServiceError(error, message);
  }

  handleServiceError(error, fallbackMessage) {
    if (error.statusCode) {
      return error;
    }

    const normalizedError = normalizePocketBaseError(error);
    const serviceError = new Error(fallbackMessage);

    serviceError.statusCode = normalizedError.status >= 500 ? 502 : normalizedError.status;
    serviceError.details = normalizedError.details;

    return serviceError;
  }
}

module.exports = new OrdersService();
