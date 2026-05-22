import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { TOKEN_KEY } from '../api/client.js';
import { authService, clearSession, readStoredUser } from '../services/authService.js';
import { normalizeRole } from '../utils/format.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.me();
        if (mounted) setUser(currentUser);
      } catch {
        clearSession();
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setToken(null);
      toast.error('Session expired. Please login again.');
    }

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      role: normalizeRole(user?.role),
      isAuthenticated: Boolean(token && user),

      async login(credentials) {
        const session = await authService.login(credentials);
        setToken(session.token || localStorage.getItem(TOKEN_KEY));
        setUser(session.user);
        return session.user;
      },

      async register(payload) {
        const session = await authService.register(payload);
        setToken(session.token || localStorage.getItem(TOKEN_KEY));
        setUser(session.user);
        return session.user;
      },

      logout() {
        authService.logout();
        setUser(null);
        setToken(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
