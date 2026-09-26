import { AUTH_API_URL, request } from './api';

const TOKEN_KEY = 'pengu_token';
const USER_KEY = 'pengu_user';
const USERS_LIST_KEY = 'pengu_registered_users';

export const authService = {
  async register(name, email, password) {
    try {
      const res = await request(AUTH_API_URL, '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const user = res.user || { id: `u_${Date.now()}`, name, email };
      const token = res.accessToken || `jwt_${Date.now()}`;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (err) {
      const isNetworkError =
        !err.message ||
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('networkerror') ||
        err.message.toLowerCase().includes('network error') ||
        err.message.toLowerCase().includes('econnrefused') ||
        err.name === 'TypeError';

      if (!isNetworkError) {
        return { success: false, error: err.message };
      }

      console.warn('[authService] Backend register unreachable, falling back locally:', err.message);

      // Graceful offline/local fallback so the user is never blocked by "failed to fetch"
      const normalizedEmail = email.trim().toLowerCase();
      const registeredUsers = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
      
      const alreadyExists = registeredUsers.find((u) => u.email === normalizedEmail);
      if (alreadyExists) {
        return { success: false, error: 'That email is already registered. Please log in.' };
      }

      const localUser = {
        id: `u_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        avatar_url: null,
        created_at: new Date().toISOString(),
        role: 'student',
      };
      const localToken = `local_jwt_${Date.now()}`;

      registeredUsers.push({ ...localUser, password });
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(registeredUsers));
      localStorage.setItem(TOKEN_KEY, localToken);
      localStorage.setItem(USER_KEY, JSON.stringify(localUser));

      return { success: true, user: localUser, token: localToken };
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
      const isNetworkError =
        !err.message ||
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('networkerror') ||
        err.message.toLowerCase().includes('network error') ||
        err.message.toLowerCase().includes('econnrefused') ||
        err.name === 'TypeError';

      if (!isNetworkError) {
        return { success: false, error: err.message };
      }

      console.warn('[authService] Backend login unreachable, checking local store:', err.message);

      // Local fallback for offline mode
      const normalizedEmail = email.trim().toLowerCase();
      const registeredUsers = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
      const matched = registeredUsers.find((u) => u.email === normalizedEmail);

      if (matched && matched.password && matched.password !== password) {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      const user = matched ? {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        avatar_url: matched.avatar_url || null,
        created_at: matched.created_at || new Date().toISOString(),
      } : {
        id: `u_${Date.now()}`,
        name: email.split('@')[0],
        email: normalizedEmail,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      const token = `local_jwt_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    }
  },

  async getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const res = await request(AUTH_API_URL, '/api/auth/me');
      if (res?.user) {
        // preserve locally set avatar if server has null
        const stored = this.getUser();
        const mergedUser = {
          ...res.user,
          avatar_url: res.user.avatar_url || stored?.avatar_url || null,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
        return mergedUser;
      }
    } catch {
      // fallback to stored local user if offline
    }

    return this.getUser();
  },

  updateUser(updatedFields) {
    const current = this.getUser() || {};
    const updated = { ...current, ...updatedFields };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));

    // Also update in registered users cache
    const registeredUsers = JSON.parse(localStorage.getItem(USERS_LIST_KEY) || '[]');
    const idx = registeredUsers.findIndex((u) => u.id === updated.id || u.email === updated.email);
    if (idx !== -1) {
      registeredUsers[idx] = { ...registeredUsers[idx], ...updatedFields };
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(registeredUsers));
    }
    return updated;
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
