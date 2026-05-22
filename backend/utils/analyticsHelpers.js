const { ORDER_STATUSES, USER_ROLES } = require('../config/collections');

const RECENT_ORDERS_WINDOW_DAYS = 7;

const roundCurrency = (amount) => {
  return Math.round(amount * 100) / 100;
};

const createCountMap = (keys = []) => {
  return keys.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});
};

const groupRecordsByField = (records = [], field, expectedKeys = []) => {
  const counts = createCountMap(expectedKeys);

  records.forEach((record) => {
    const key = record[field] || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
};

const calculateTotalRevenue = (orders = []) => {
  const total = orders.reduce((sum, order) => {
    return sum + Number(order.totalPrice || 0);
  }, 0);

  return roundCurrency(total);
};

const countRecentOrders = (orders = [], windowDays = RECENT_ORDERS_WINDOW_DAYS) => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - windowDays);

  return orders.reduce((count, order) => {
    const createdAt = order.created ? new Date(order.created) : null;

    if (createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= threshold) {
      return count + 1;
    }

    return count;
  }, 0);
};

const buildAnalyticsOverview = ({
  usersTotal = 0,
  restaurantsTotal = 0,
  ordersTotal = 0,
  users = [],
  orders = [],
}) => {
  return {
    totals: {
      users: usersTotal,
      restaurants: restaurantsTotal,
      orders: ordersTotal,
      revenue: calculateTotalRevenue(orders),
    },
    ordersByStatus: groupRecordsByField(orders, 'status', Object.values(ORDER_STATUSES)),
    usersByRole: groupRecordsByField(users, 'role', Object.values(USER_ROLES)),
    recentOrders: {
      count: countRecentOrders(orders),
      windowDays: RECENT_ORDERS_WINDOW_DAYS,
    },
  };
};

module.exports = {
  RECENT_ORDERS_WINDOW_DAYS,
  buildAnalyticsOverview,
  calculateTotalRevenue,
  countRecentOrders,
  groupRecordsByField,
};
