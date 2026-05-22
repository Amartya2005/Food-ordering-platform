import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const joinedRestaurantIdsRef = useRef(new Set());

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setSocket(null);
      joinedRestaurantIdsRef.current.clear();
      return undefined;
    }

    const instance = io(SOCKET_URL, {
      auth: {
        token,
        authorization: `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    const handleConnect = () => {
      setConnected(true);
      joinedRestaurantIdsRef.current.forEach((restaurantId) => {
        instance.emit('restaurant:join', { restaurantId });
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleConnectError = (error) => {
      setConnected(false);

      if (/auth|token|unauthorized|401/i.test(error?.message || '')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    };

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);
    instance.on('connect_error', handleConnectError);
    setSocket(instance);

    return () => {
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
      instance.off('connect_error', handleConnectError);
      instance.disconnect();
    };
  }, [token]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      on(eventName, handler) {
        if (!socket) return () => {};

        const wrappedHandler = (payload) => handler(payload?.data ?? payload);
        socket.on(eventName, wrappedHandler);

        return () => socket.off(eventName, wrappedHandler);
      },
      emit(eventName, payload) {
        socket?.emit(eventName, payload);
      },
      joinRestaurantRoom(restaurantId) {
        if (!restaurantId) return;
        joinedRestaurantIdsRef.current.add(restaurantId);

        if (socket?.connected) {
          socket.emit('restaurant:join', { restaurantId });
        }
      },
      leaveRestaurantRoom(restaurantId) {
        if (!restaurantId) return;
        joinedRestaurantIdsRef.current.delete(restaurantId);

        if (socket?.connected) {
          socket.emit('restaurant:leave', { restaurantId });
        }
      }
    }),
    [connected, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
}
