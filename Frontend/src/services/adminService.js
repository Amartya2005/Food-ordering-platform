import api, { unwrap } from '../api/client.js';

function normalizeListParams(params = {}) {
  const nextParams = { ...params };

  if (nextParams.limit !== undefined && nextParams.perPage === undefined) {
    nextParams.perPage = nextParams.limit;
    delete nextParams.limit;
  }

  return nextParams;
}

function normalizeOverview(overview) {
  return {
    ...overview,
    totalUsers: overview?.totalUsers ?? overview?.totals?.users ?? 0,
    totalRestaurants: overview?.totalRestaurants ?? overview?.totals?.restaurants ?? 0,
    totalOrders: overview?.totalOrders ?? overview?.totals?.orders ?? 0,
    totalRevenue: overview?.totalRevenue ?? overview?.totals?.revenue ?? 0
  };
}

export const adminService = {
  async users(params = {}) {
    return unwrap(await api.get('/admin/users', { params: normalizeListParams(params) }));
  },

  async deleteUser(id) {
    return unwrap(await api.delete(`/admin/users/${id}`));
  },

  async restaurants(params = {}) {
    return unwrap(await api.get('/admin/restaurants', { params: normalizeListParams(params) }));
  },

  async verifyRestaurant(id, isVerified = true) {
    return unwrap(await api.put(`/admin/restaurants/${id}/verify`, { isVerified }));
  },

  async deleteRestaurant(id) {
    return unwrap(await api.delete(`/admin/restaurants/${id}`));
  },

  async overview() {
    return normalizeOverview(unwrap(await api.get('/admin/analytics/overview')));
  }
};
