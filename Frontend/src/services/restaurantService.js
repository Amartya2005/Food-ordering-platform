import api, { toFormData, unwrap } from '../api/client.js';

function normalizeRestaurant(restaurant) {
  if (!restaurant) return restaurant;

  return {
    ...restaurant,
    cuisine: restaurant.cuisine || restaurant.category || '',
    address: restaurant.address || restaurant.location || ''
  };
}

function normalizeRestaurantPayload(payload = {}) {
  const nextPayload = {
    name: payload.name,
    category: payload.category ?? payload.cuisine,
    location: payload.location ?? payload.address
  };

  if (payload.image) {
    nextPayload.image = payload.image;
  }

  return nextPayload;
}

function normalizeListParams(params = {}) {
  const nextParams = { ...params };

  if (nextParams.limit !== undefined && nextParams.perPage === undefined) {
    nextParams.perPage = nextParams.limit;
    delete nextParams.limit;
  }

  return nextParams;
}

export const restaurantService = {
  async list(params = {}) {
    const data = unwrap(await api.get('/restaurants', { params: normalizeListParams(params) }));
    return {
      ...data,
      restaurants: (data?.restaurants || []).map(normalizeRestaurant)
    };
  },

  async getById(id) {
    const data = unwrap(await api.get(`/restaurants/${id}`));
    return normalizeRestaurant(data?.restaurant || data);
  },

  async listOwned(ownerId, params = {}) {
    const data = await this.list({ ...params, perPage: params.perPage || 100 });
    return (data?.restaurants || []).filter((restaurant) => !ownerId || restaurant.ownerId === ownerId);
  },

  async create(payload) {
    const normalizedPayload = normalizeRestaurantPayload(payload);
    const body = normalizedPayload.image ? toFormData(normalizedPayload) : normalizedPayload;
    const data = unwrap(await api.post('/restaurants', body));
    return normalizeRestaurant(data?.restaurant || data);
  },

  async update(id, payload) {
    const normalizedPayload = normalizeRestaurantPayload(payload);
    const body = normalizedPayload.image ? toFormData(normalizedPayload) : normalizedPayload;
    const data = unwrap(await api.put(`/restaurants/${id}`, body));
    return normalizeRestaurant(data?.restaurant || data);
  },

  async remove(id) {
    return unwrap(await api.delete(`/restaurants/${id}`));
  }
};
