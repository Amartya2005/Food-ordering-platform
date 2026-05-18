const BasePocketBaseService = require('./base.service');
const env = require('../../config/env');
const { COLLECTION_NAMES, USER_ROLES } = require('../../config/collections');
const { createPocketBaseClient, getPocketBase } = require('../../config/pocketbase');
const { appendFileToFormData } = require('../../utils/fileHelpers');
const { sanitizeMenuItem, sanitizeMenuItemList } = require('../../utils/menuHelpers');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');

class MenuService extends BasePocketBaseService {
  constructor() {
    super(COLLECTION_NAMES.menuItems);
    this.serverClient = null;
  }

  async createMenuItem(payload, imageFile, authenticatedUser) {
    const client = await this.getServerClient();

    await this.verifyRestaurantManagementAccess(payload.restaurantId, authenticatedUser, client);

    const formData = this.buildMenuItemFormData(payload, imageFile);

    try {
      const menuItem = await client.collection(this.collectionName).create(formData, {
        requestKey: null,
      });

      return sanitizeMenuItem(menuItem, client);
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to create menu item.');
    }
  }

  async getRestaurantMenu(restaurantId, query = {}) {
    const client = getPocketBase();
    const page = this.normalizePositiveInteger(query.page, 1);
    const perPage = Math.min(this.normalizePositiveInteger(query.perPage, 50), 100);
    const options = {
      sort: query.sort || 'itemName',
      filter: this.buildRestaurantMenuFilter(client, restaurantId, query),
      requestKey: null,
    };

    await this.ensureRestaurantExists(restaurantId, client);

    try {
      const result = await client.collection(this.collectionName).getList(page, perPage, options);

      return {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        menuItems: sanitizeMenuItemList(result.items, client),
      };
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to retrieve restaurant menu.');
    }
  }

  async updateMenuItem(menuItemId, payload, imageFile) {
    const client = await this.getServerClient();
    const formData = this.buildMenuItemFormData(payload, imageFile);

    try {
      const menuItem = await client.collection(this.collectionName).update(menuItemId, formData, {
        requestKey: null,
      });

      return sanitizeMenuItem(menuItem, client);
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to update menu item.');
    }
  }

  async deleteMenuItem(menuItemId) {
    const client = await this.getServerClient();

    try {
      await client.collection(this.collectionName).delete(menuItemId, {
        requestKey: null,
      });

      return true;
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to delete menu item.');
    }
  }

  async verifyMenuOwnership(menuItemId, authenticatedUser) {
    if (!authenticatedUser) {
      const error = new Error('Authentication is required.');
      error.statusCode = 401;
      throw error;
    }

    const client = await this.getServerClient();
    const menuItem = await this.getMenuItemRecordById(menuItemId, client, {
      expand: 'restaurantId',
    });

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeMenuItem(menuItem, client);
    }

    const restaurant = menuItem.expand && menuItem.expand.restaurantId
      ? menuItem.expand.restaurantId
      : await this.getRestaurantRecordById(menuItem.restaurantId, client);

    if (restaurant.ownerId !== authenticatedUser.id) {
      const error = new Error('You can only manage menu items for your own restaurants.');
      error.statusCode = 403;
      throw error;
    }

    return sanitizeMenuItem(menuItem, client);
  }

  async toggleAvailability(menuItemId, availability) {
    const client = await this.getServerClient();
    let nextAvailability = availability;

    if (nextAvailability === undefined) {
      const currentMenuItem = await this.getMenuItemRecordById(menuItemId, client);
      nextAvailability = !currentMenuItem.availability;
    }

    try {
      const menuItem = await client.collection(this.collectionName).update(
        menuItemId,
        {
          availability: nextAvailability,
        },
        {
          requestKey: null,
        },
      );

      return sanitizeMenuItem(menuItem, client);
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to update menu availability.');
    }
  }

  async getMenuItemRecordById(menuItemId, client = getPocketBase(), options = {}) {
    try {
      return await client.collection(this.collectionName).getOne(menuItemId, {
        requestKey: null,
        ...options,
      });
    } catch (error) {
      throw this.handleNotFoundError(error, 'Menu item not found.');
    }
  }

  async verifyRestaurantManagementAccess(restaurantId, authenticatedUser, client) {
    if (!authenticatedUser) {
      const error = new Error('Authentication is required.');
      error.statusCode = 401;
      throw error;
    }

    const restaurant = await this.getRestaurantRecordById(restaurantId, client);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return restaurant;
    }

    if (restaurant.ownerId !== authenticatedUser.id) {
      const error = new Error('You can only create menu items for your own restaurants.');
      error.statusCode = 403;
      throw error;
    }

    return restaurant;
  }

  async ensureRestaurantExists(restaurantId, client) {
    await this.getRestaurantRecordById(restaurantId, client);
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

  buildMenuItemFormData(payload, imageFile) {
    const formData = new FormData();

    ['restaurantId', 'itemName', 'price', 'availability'].forEach((field) => {
      if (payload[field] !== undefined) {
        formData.append(field, String(payload[field]));
      }
    });

    appendFileToFormData(formData, 'image', imageFile);

    return formData;
  }

  buildRestaurantMenuFilter(client, restaurantId, query) {
    const filterParts = ['restaurantId = {:restaurantId}'];
    const params = {
      restaurantId,
    };

    if (query.availability !== undefined) {
      const availability = this.parseAvailabilityQuery(query.availability);

      if (availability !== null) {
        filterParts.push('availability = {:availability}');
        params.availability = availability;
      }
    }

    if (query.search) {
      filterParts.push('itemName ~ {:search}');
      params.search = query.search.trim();
    }

    return client.filter(filterParts.join(' && '), params);
  }

  parseAvailabilityQuery(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      return false;
    }

    return null;
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
        'PocketBase superuser credentials are required for protected menu operations.',
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

module.exports = new MenuService();
