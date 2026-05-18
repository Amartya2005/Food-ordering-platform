const sanitizeOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    customerId: order.customerId,
    restaurantId: order.restaurantId,
    items: order.items,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentStatus: order.paymentStatus,
    created: order.created,
    updated: order.updated,
  };
};

const sanitizeOrderList = (orders) => {
  return orders.map(sanitizeOrder);
};

module.exports = {
  sanitizeOrder,
  sanitizeOrderList,
};
