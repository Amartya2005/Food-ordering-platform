import api, { unwrap } from '../api/client.js';

function normalizeOrder(order) {
  if (!order) return order;

  return {
    ...order,
    totalAmount: order.totalAmount ?? order.totalPrice ?? order.total ?? 0,
    total: order.total ?? order.totalPrice ?? order.totalAmount ?? 0
  };
}

function normalizeOrderListPayload(payload) {
  return {
    ...payload,
    orders: (payload?.orders || []).map(normalizeOrder)
  };
}

function normalizeListParams(params = {}) {
  const nextParams = { ...params };

  if (nextParams.limit !== undefined && nextParams.perPage === undefined) {
    nextParams.perPage = nextParams.limit;
    delete nextParams.limit;
  }

  return nextParams;
}

export const orderService = {
  async place(payload) {
    const body = {
      restaurantId: payload.restaurantId,
      items: (payload.items || []).map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity
      }))
    };
    const data = unwrap(await api.post('/orders', body));
    return normalizeOrder(data?.order || data);
  },

  async history(params = {}) {
    const data = unwrap(await api.get('/orders/my-orders', { params: normalizeListParams(params) }));
    return normalizeOrderListPayload(data);
  },

  async getById(id) {
    const data = unwrap(await api.get(`/orders/${id}`));
    return normalizeOrder(data?.order || data);
  },

  async restaurantOrders(restaurantId, params = {}) {
    const data = unwrap(
      await api.get(`/orders/restaurant/${restaurantId}`, { params: normalizeListParams(params) })
    );
    return normalizeOrderListPayload(data);
  },

  async restaurantOrdersForRestaurants(restaurantIds = [], params = {}) {
    const responses = await Promise.all(
      restaurantIds.map((restaurantId) => this.restaurantOrders(restaurantId, params))
    );

    const orders = responses
      .flatMap((response) => response?.orders || [])
      .sort((left, right) => new Date(right.created || 0) - new Date(left.created || 0));

    return orders;
  },

  async updateStatus(id, status) {
    const data = unwrap(await api.put(`/orders/status/${id}`, { status }));
    return normalizeOrder(data?.order || data);
  }
};
