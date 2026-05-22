import api, { TOKEN_KEY, USER_KEY, unwrap } from '../api/client.js';

function extractToken(payload) {
  return payload?.token || payload?.jwt || payload?.accessToken || payload?.authToken;
}

function extractUser(payload) {
  return payload?.user || payload?.record || payload;
}

export function saveSession(payload) {
  const token = extractToken(payload);
  const user = extractUser(payload);

  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { token, user };
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export const authService = {
  async register(payload) {
    const data = unwrap(await api.post('/auth/register', payload));
    return saveSession(data);
  },

  async login(payload) {
    const data = unwrap(await api.post('/auth/login', payload));
    return saveSession(data);
  },

  async me() {
    const data = unwrap(await api.get('/auth/me'));
    const user = extractUser(data);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: clearSession
};
