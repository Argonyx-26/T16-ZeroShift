/**
 * Shared API configuration and fetch wrapper for ZeroShift / PenguLearn
 */

export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4000';
export const STATMODELS_API_URL = import.meta.env.VITE_STATMODELS_API_URL || 'http://localhost:8000';

export async function request(baseUrl, endpoint, options = {}) {
  const token = localStorage.getItem('pengu_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error?.message || data?.error || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[API] ${endpoint} failed:`, err.message);
    throw err;
  }
}
