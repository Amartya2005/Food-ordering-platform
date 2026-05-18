const { USER_ROLES } = require('../config/collections');

const SOCKET_EVENTS = Object.freeze({
  customerOrderCreated: 'order:created',
  customerOrderStatusUpdated: 'order:statusUpdated',
  restaurantNewOrder: 'restaurant:newOrder',
  restaurantOrderStatusUpdated: 'restaurant:orderStatusUpdated',
  socketConnected: 'socket:connected',
  socketDisconnected: 'socket:disconnected',
  socketError: 'socket:error',
  restaurantJoin: 'restaurant:join',
  restaurantLeave: 'restaurant:leave',
});

const SOCKET_ROOMS = Object.freeze({
  customer: (customerId) => `customer:${customerId}`,
  restaurant: (restaurantId) => `restaurant:${restaurantId}`,
});

const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers.authorization;

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const buildSocketUser = (decodedToken) => {
  const userId = decodedToken.sub || decodedToken.id;
  const validRoles = Object.values(USER_ROLES);

  if (!userId || !decodedToken.email || !validRoles.includes(decodedToken.role)) {
    return null;
  }

  return {
    id: userId,
    email: decodedToken.email,
    role: decodedToken.role,
    name: decodedToken.name,
  };
};

const buildSocketPayload = (event, data = {}) => {
  return {
    event,
    data,
    emittedAt: new Date().toISOString(),
  };
};

module.exports = {
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  extractSocketToken,
  buildSocketUser,
  buildSocketPayload,
};
