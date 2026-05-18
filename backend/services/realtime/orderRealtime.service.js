const { getSocket } = require('../../config/socket');
const {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  buildSocketPayload,
} = require('../../utils/socketHelpers');

const emitToRoom = (room, event, data) => {
  try {
    const io = getSocket();
    io.to(room).emit(event, buildSocketPayload(event, data));
    return true;
  } catch (error) {
    if (error.message !== 'Socket.io has not been initialized.') {
      console.warn(`Realtime emit failed for ${event}: ${error.message}`);
    }

    return false;
  }
};

const emitOrderCreated = (order) => {
  emitToRoom(SOCKET_ROOMS.customer(order.customerId), SOCKET_EVENTS.customerOrderCreated, {
    order,
  });

  emitToRoom(SOCKET_ROOMS.restaurant(order.restaurantId), SOCKET_EVENTS.restaurantNewOrder, {
    order,
  });
};

const emitOrderStatusUpdated = (order) => {
  emitToRoom(SOCKET_ROOMS.customer(order.customerId), SOCKET_EVENTS.customerOrderStatusUpdated, {
    order,
  });

  emitToRoom(
    SOCKET_ROOMS.restaurant(order.restaurantId),
    SOCKET_EVENTS.restaurantOrderStatusUpdated,
    {
      order,
    },
  );
};

module.exports = {
  emitOrderCreated,
  emitOrderStatusUpdated,
};
