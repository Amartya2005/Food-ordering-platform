const { Server } = require('socket.io');
const env = require('./env');
const verifyToken = require('../utils/verifyToken');
const { USER_ROLES } = require('./collections');
const restaurantsService = require('../services/pocketbase/restaurants.service');
const { validateOrderIdParam } = require('../validations/order.validation');
const {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  extractSocketToken,
  buildSocketUser,
  buildSocketPayload,
} = require('../utils/socketHelpers');

let io = null;

const authenticateSocket = (socket, next) => {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      const error = new Error('Socket authentication token is required.');
      error.statusCode = 401;
      throw error;
    }

    const decodedToken = verifyToken(token);
    const user = buildSocketUser(decodedToken);

    if (!user) {
      const error = new Error('Invalid socket authentication token claims.');
      error.statusCode = 401;
      throw error;
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const emitSocketError = (socket, message, details = null) => {
  socket.emit(
    SOCKET_EVENTS.socketError,
    buildSocketPayload(SOCKET_EVENTS.socketError, {
      message,
      details,
    }),
  );
};

const joinCustomerRoom = (socket) => {
  const { user } = socket.data;

  if (user.role === USER_ROLES.customer || user.role === USER_ROLES.admin) {
    const room = SOCKET_ROOMS.customer(user.id);
    socket.join(room);
    return room;
  }

  return null;
};

const handleRestaurantJoin = async (socket, payload = {}) => {
  try {
    const { restaurantId } = payload;
    const validationResult = validateOrderIdParam('restaurantId', restaurantId);

    if (!validationResult.valid) {
      emitSocketError(socket, 'Invalid restaurant room request.', validationResult.errors);
      return;
    }

    await restaurantsService.verifyRestaurantOwnership(restaurantId, socket.data.user);

    const room = SOCKET_ROOMS.restaurant(restaurantId);
    socket.join(room);

    socket.emit(
      SOCKET_EVENTS.restaurantJoin,
      buildSocketPayload(SOCKET_EVENTS.restaurantJoin, {
        room,
        restaurantId,
      }),
    );
  } catch (error) {
    emitSocketError(socket, error.message || 'Unable to join restaurant room.');
  }
};

const handleRestaurantLeave = (socket, payload = {}) => {
  const { restaurantId } = payload;
  const validationResult = validateOrderIdParam('restaurantId', restaurantId);

  if (!validationResult.valid) {
    emitSocketError(socket, 'Invalid restaurant room request.', validationResult.errors);
    return;
  }

  const room = SOCKET_ROOMS.restaurant(restaurantId);
  socket.leave(room);

  socket.emit(
    SOCKET_EVENTS.restaurantLeave,
    buildSocketPayload(SOCKET_EVENTS.restaurantLeave, {
      room,
      restaurantId,
    }),
  );
};

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const customerRoom = joinCustomerRoom(socket);

    socket.emit(
      SOCKET_EVENTS.socketConnected,
      buildSocketPayload(SOCKET_EVENTS.socketConnected, {
        socketId: socket.id,
        user: socket.data.user,
        rooms: customerRoom ? [customerRoom] : [],
      }),
    );

    socket.on(SOCKET_EVENTS.restaurantJoin, (payload) => {
      handleRestaurantJoin(socket, payload);
    });

    socket.on(SOCKET_EVENTS.restaurantLeave, (payload) => {
      handleRestaurantLeave(socket, payload);
    });

    socket.on('error', (error) => {
      emitSocketError(socket, error.message || 'Socket error.');
    });

    socket.on('disconnecting', (reason) => {
      socket.emit(
        SOCKET_EVENTS.socketDisconnected,
        buildSocketPayload(SOCKET_EVENTS.socketDisconnected, {
          socketId: socket.id,
          reason,
        }),
      );
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    });
  });

  return io;
};

const getSocket = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized.');
  }

  return io;
};

module.exports = {
  initializeSocket,
  getSocket,
};
