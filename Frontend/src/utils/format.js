import { SOCKET_URL } from '../api/client.js';

export const orderStatuses = ['Received', 'Preparing', 'Ready', 'Delivered'];

export function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.restaurants)) return payload.restaurants;
  if (Array.isArray(payload?.menuItems)) return payload.menuItems;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function pageMeta(payload) {
  return {
    page: Number(payload?.page || payload?.currentPage || 1),
    perPage: Number(payload?.perPage || payload?.limit || 0),
    totalPages: Number(payload?.totalPages || payload?.total_pages || 1),
    totalItems: Number(payload?.totalItems || payload?.total || 0)
  };
}

export function currency(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function getId(item) {
  return item?.id || item?._id || item?.collectionId;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

export function imageOf(item) {
  const raw =
    item?.imageUrl ||
    item?.image ||
    item?.photo ||
    item?.thumbnail ||
    item?.coverImage ||
    item?.images?.[0];

  if (!raw) {
    return FALLBACK_IMAGE;
  }

  if (typeof raw === 'string' && raw.startsWith('/')) {
    return `${SOCKET_URL}${raw}`;
  }

  return raw;
}

export function userName(user) {
  return user?.name || user?.fullName || user?.username || user?.email || 'User';
}

export function statusPercent(status) {
  const index = Math.max(0, orderStatuses.indexOf(status));
  return Math.round(((index + 1) / orderStatuses.length) * 100);
}

export function normalizeRole(role) {
  const normalizedRole = String(role || 'customer')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (normalizedRole === 'restaurant_owner' || normalizedRole === 'restaurant') {
    return 'restaurant';
  }

  return normalizedRole;
}

export function statusClassName(status) {
  return String(status || orderStatuses[0]).trim().toLowerCase().replace(/\s+/g, '-');
}
