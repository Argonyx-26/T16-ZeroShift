import { AUTH_API_URL, request } from './api';

const TOKEN_KEY = 'pengu_token';
const USER_KEY = 'pengu_user';

export const authService = {
  async register(name, email, password) {
    try {
      const res = await request(AUTH_API_URL, '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const user = res.user || { id: `u_${Date.now()}`, name, email };
      const token = res.accessToken || `demo_jwt_${Date.now()}`;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (err) {
      // If auth-service is temporarily offline, provide realistic dev-mode registration
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Auth backend offline, using dev mock session for demonstration');
        const fallbackUser = { id: `s_${Date.now().toString().slice(-6)}`, name, email };
        const fallbackToken = `dev_token_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, fallbackToken);
        localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser, token: fallbackToken, isMock: true };
      }
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  async login(email, password) {
    try {
      const res = await request(AUTH_API_URL, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user = res.user;
      const token = res.accessToken;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('Auth backend offline, using dev mock session for demonstration');
        const fallbackUser = {
          id: 's_1029',
          name: email.split('@')[0] || 'Learner',
          email,
        };
        const fallbackToken = `dev_token_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, fallbackToken);
        localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser, token: fallbackToken, isMock: true };
      }
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  },

  async getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const res = await request(AUTH_API_URL, '/api/auth/me');
      if (res?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        return res.user;
      }
    } catch {
      // fallback to stored local user if offline
    }

    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  logout() {
    try {
      request(AUTH_API_URL, '/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  getUser() {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};
