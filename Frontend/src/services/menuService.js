import api, { toFormData, unwrap } from '../api/client.js';

function normalizeMenuItem(menuItem) {
  if (!menuItem) return menuItem;

  return {
    ...menuItem,
    name: menuItem.name || menuItem.itemName || '',
    isAvailable: menuItem.isAvailable ?? menuItem.availability ?? true
  };
}

function normalizeMenuPayload(payload = {}, includeRestaurantId = true) {
  const nextPayload = {
    itemName: payload.itemName ?? payload.name,
    price: payload.price,
    availability: payload.availability ?? payload.isAvailable
  };

  if (includeRestaurantId) {
    nextPayload.restaurantId = payload.restaurantId;
  }

  if (payload.image) {
    nextPayload.image = payload.image;
  }

  return nextPayload;
}

export const menuService = {
  async byRestaurant(restaurantId, params = {}) {
    const data = unwrap(await api.get(`/menu/${restaurantId}`, { params }));
    return {
      ...data,
      menuItems: (data?.menuItems || []).map(normalizeMenuItem)
    };
  },

  async create(payload) {
    const normalizedPayload = normalizeMenuPayload(payload);
    const body = normalizedPayload.image ? toFormData(normalizedPayload) : normalizedPayload;
    const data = unwrap(await api.post('/menu', body));
    return normalizeMenuItem(data?.menuItem || data);
  },

  async update(id, payload) {
    const normalizedPayload = normalizeMenuPayload(payload, false);
    const body = normalizedPayload.image ? toFormData(normalizedPayload) : normalizedPayload;
    const data = unwrap(await api.put(`/menu/${id}`, body));
    return normalizeMenuItem(data?.menuItem || data);
  },

  async remove(id) {
    return unwrap(await api.delete(`/menu/${id}`));
  }
};
