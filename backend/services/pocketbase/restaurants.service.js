const BasePocketBaseService = require('./base.service');
const env = require('../../config/env');
const { COLLECTION_NAMES, USER_ROLES } = require('../../config/collections');
const { createPocketBaseClient, getPocketBase } = require('../../config/pocketbase');
const { appendFileToFormData } = require('../../utils/fileHelpers');
const {
  sanitizeRestaurant,
  sanitizeRestaurantList,
} = require('../../utils/restaurantHelpers');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');

class RestaurantsService extends BasePocketBaseService {
  constructor() {
    super(COLLECTION_NAMES.restaurants);
    this.serverClient = null;
  }

  async createRestaurant(payload, imageFile, authenticatedUser) {
    const client = await this.getServerClient();
    const formData = this.buildRestaurantFormData(
      {
        ownerId: authenticatedUser.id,
        name: payload.name,
        category: payload.category,
        location: payload.location,
      },
      imageFile,
    );

    try {
      const restaurant = await client.collection(this.collectionName).create(formData, {
        requestKey: null,
      });

      return sanitizeRestaurant(restaurant, client);
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to create restaurant.');
    }
  }

  async getRestaurants(query = {}) {
    const client = getPocketBase();
    const page = this.normalizePositiveInteger(query.page, 1);
    const perPage = Math.min(this.normalizePositiveInteger(query.perPage, 20), 50);
    const options = {
      sort: query.sort || '-created',
      requestKey: null,
    };

    const filter = this.buildRestaurantFilter(client, query);

    if (filter) {
      options.filter = filter;
    }

    try {
      const result = await client.collection(this.collectionName).getList(page, perPage, options);

      return {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        restaurants: sanitizeRestaurantList(result.items, client),
      };
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to retrieve restaurants.');
    }
  }

  async getRestaurantById(restaurantId) {
    const client = getPocketBase();

    try {
      const restaurant = await client.collection(this.collectionName).getOne(restaurantId, {
        requestKey: null,
      });

      return sanitizeRestaurant(restaurant, client);
    } catch (error) {
      throw this.handleNotFoundError(error, 'Restaurant not found.');
    }
  }

  async getRestaurantRecordById(restaurantId, client = getPocketBase()) {
    try {
      return await client.collection(this.collectionName).getOne(restaurantId, {
        requestKey: null,
      });
    } catch (error) {
      throw this.handleNotFoundError(error, 'Restaurant not found.');
    }
  }

  async updateRestaurant(restaurantId, payload, imageFile) {
    const client = await this.getServerClient();
    const formData = this.buildRestaurantFormData(payload, imageFile);

    try {
      const restaurant = await client.collection(this.collectionName).update(restaurantId, formData, {
        requestKey: null,
      });

      return sanitizeRestaurant(restaurant, client);
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to update restaurant.');
    }
  }

  async deleteRestaurant(restaurantId) {
    const client = await this.getServerClient();

    try {
      await client.collection(this.collectionName).delete(restaurantId, {
        requestKey: null,
      });

      return true;
    } catch (error) {
      throw this.handleServiceError(error, 'Unable to delete restaurant.');
    }
  }

  async verifyRestaurantOwnership(restaurantId, authenticatedUser) {
    if (!authenticatedUser) {
      const error = new Error('Authentication is required.');
      error.statusCode = 401;
      throw error;
    }

    const client = await this.getServerClient();
    const restaurant = await this.getRestaurantRecordById(restaurantId, client);

    if (authenticatedUser.role === USER_ROLES.admin) {
      return sanitizeRestaurant(restaurant, client);
    }

    if (restaurant.ownerId !== authenticatedUser.id) {
      const error = new Error('You can only manage your own restaurants.');
      error.statusCode = 403;
      throw error;
    }

    return sanitizeRestaurant(restaurant, client);
  }

  buildRestaurantFormData(payload, imageFile) {
    const formData = new FormData();

    ['ownerId', 'name', 'category', 'location'].forEach((field) => {
      if (payload[field] !== undefined) {
        formData.append(field, payload[field]);
      }
    });

    appendFileToFormData(formData, 'image', imageFile);

    return formData;
  }

  buildRestaurantFilter(client, query) {
    const filterParts = [];
    const params = {};

    if (query.category) {
      filterParts.push('category ~ {:category}');
      params.category = query.category.trim();
    }

    if (query.location) {
      filterParts.push('location ~ {:location}');
      params.location = query.location.trim();
    }

    if (query.search) {
      filterParts.push('(name ~ {:search} || category ~ {:search} || location ~ {:search})');
      params.search = query.search.trim();
    }

    if (filterParts.length === 0) {
      return '';
    }

    return client.filter(filterParts.join(' && '), params);
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
        'PocketBase superuser credentials are required for protected restaurant operations.',
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

module.exports = new RestaurantsService();
