const { Server } = require('socket.io');
const env = require('./env');
const { corsOptions } = require('./cors');
const verifyToken = require('../utils/verifyToken');
const { USER_ROLES } = require('./collections');
const restaurantsService = require('../services/mysql/restaurants.service');
const { validateOrderIdParam } = require('../validations/order.validation');
const logger = require('../utils/logger');
const {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  extractSocketToken,
  buildSocketUser,
  buildSocketPayload,
} = require('../utils/socketHelpers');

let io = null;
const socketMetrics = {
  totalConnections: 0,
  activeConnections: new Set(),
};

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

const initializeSocketRoomState = (socket) => {
  socket.data.rooms = new Set();
  socket.data.connectedAt = Date.now();
};

const trackRoomJoin = (socket, room) => {
  if (socket.data.rooms.has(room)) {
    return false;
  }

  socket.join(room);
  socket.data.rooms.add(room);
  return true;
};

const trackRoomLeave = (socket, room) => {
  if (!socket.data.rooms.has(room)) {
    return false;
  }

  socket.leave(room);
  socket.data.rooms.delete(room);
  return true;
};

const cleanupSocketRooms = (socket) => {
  if (!socket.data.rooms) {
    return;
  }

  socket.data.rooms.forEach((room) => {
    socket.leave(room);
  });

  socket.data.rooms.clear();
};

const trackSocketConnection = (socket) => {
  socketMetrics.activeConnections.add(socket.id);
  socketMetrics.totalConnections += 1;

  logger.debug('Socket connected.', {
    socketId: socket.id,
    totalConnections: socketMetrics.totalConnections,
    activeConnections: socketMetrics.activeConnections.size,
  });
};

const trackSocketDisconnection = (socket) => {
  socketMetrics.activeConnections.delete(socket.id);

  logger.debug('Socket disconnected.', {
    socketId: socket.id,
    activeConnections: socketMetrics.activeConnections.size,
  });
};

const joinCustomerRoom = (socket) => {
  const { user } = socket.data;

  if (user.role === USER_ROLES.customer || user.role === USER_ROLES.admin) {
    const room = SOCKET_ROOMS.customer(user.id);
    trackRoomJoin(socket, room);
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
    trackRoomJoin(socket, room);

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
  trackRoomLeave(socket, room);

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
      origin: corsOptions.origin,
      methods: corsOptions.methods,
      credentials: corsOptions.credentials,
      allowedHeaders: corsOptions.allowedHeaders,
    },
    transports: ['websocket', 'polling'],
    connectTimeout: 10000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    initializeSocketRoomState(socket);
    trackSocketConnection(socket);

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

    socket.on('disconnecting', () => {
      cleanupSocketRooms(socket);
    });

    socket.on('disconnect', (reason) => {
      trackSocketDisconnection(socket);
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

const getSocketMetrics = () => {
  return {
    totalConnections: socketMetrics.totalConnections,
    activeConnections: socketMetrics.activeConnections.size,
  };
};

module.exports = {
  initializeSocket,
  getSocket,
  getSocketMetrics,
};
