const sanitizeOrder = (order) => {
  if (!order) return null;

  return {
    id: order.id,
    customerId: order.customer_id || order.customerId,
    restaurantId: order.restaurant_id || order.restaurantId,
    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    totalPrice: Number(order.total_price || order.totalPrice),
    status: order.status,
    paymentStatus: order.payment_status || order.paymentStatus,
    created: order.created_at || order.created,
    updated: order.updated_at || order.updated,
  };
};

const sanitizeOrderList = (orders) => {
  return orders.map(sanitizeOrder);
};

module.exports = {
  sanitizeOrder,
  sanitizeOrderList,
};
