import axios from 'axios';
import { supabase } from './supabase.js';
import useAuthStore from '../store/authStore';

let isLoggingOut = false;
export const handleTokenExpiration = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('login_timestamp');
    localStorage.removeItem('profile_frame_id');
    sessionStorage.clear();

    await supabase.auth.signOut().catch(() => {});
    useAuthStore.getState().logout();
  } catch (err) {
    console.error('Error during auto logout on token expiration:', err);
  } finally {
    if (typeof window !== 'undefined') {
      const publicPaths = ['/login', '/register', '/reset-password'];
      const pathname = window.location.pathname;
      const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
      if (!isPublicPath) {
        window.location.href = '/login?expired=true';
      } else {
        isLoggingOut = false;
      }
    } else {
      isLoggingOut = false;
    }
  }
};

const api = axios.create({
  // ดึงค่านำจาก Environment Variable เสมอ ไม่ว่าจะเป็น Dev หรือ Prod
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'https://share-ed-backend-6jer.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token automatically
api.interceptors.request.use(
  async (config) => {
    // If the data is FormData, remove the default Content-Type header
    // so Axios can set it automatically with the correct boundary parameter.
    if (config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        } else {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }
    }

    // Check if Authorization header is already provided
    const existingAuth =
      (config.headers && typeof config.headers.get === 'function' ? config.headers.get('Authorization') : null) ||
      config.headers?.Authorization ||
      config.headers?.authorization;

    if (existingAuth) {
      return config;
    }

    let token = null;
    try {
      let { data, error } = await supabase.auth.getSession();
      let session = (!error && data?.session) || null;

      // If token expired according to expires_at timestamp, invalidate current session object
      if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
        session = null;
      }

      // If session exists but access_token is absent or expired, try refresh
      if (!session?.access_token && typeof supabase.auth.refreshSession === 'function') {
        const refreshed = await supabase.auth.refreshSession().catch(() => null);
        session = refreshed?.data?.session || null;
      }
      token = session?.access_token || null;
    } catch {
      token = null;
    }

    // Secondary fallback: check local storage token
    if (!token) {
      try {
        const local = localStorage.getItem('access_token');
        if (local && local !== 'undefined' && local !== 'null') {
          token = local;
        }
      } catch {}
    }

    if (token && token !== 'undefined' && token !== 'null') {
      try { localStorage.setItem('access_token', token); } catch {}
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        if (!config.headers) config.headers = {};
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors & token auto-recovery
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 Unauthorized handling
    if (status === 401) {
      // If request has not been retried yet, attempt to refresh the session
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data, error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr && data?.session?.access_token) {
            const newToken = data.session.access_token;
            try { localStorage.setItem('access_token', newToken); } catch {}
            if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            } else {
              if (!originalRequest.headers) originalRequest.headers = {};
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          }
        } catch {
          // Session refresh failed
        }
      }

      // If token refresh failed, or retried request still returns 401:
      // The token/session is expired or invalid -> trigger immediate logout
      const hadAuth =
        useAuthStore.getState().isAuthenticated ||
        !!localStorage.getItem('access_token') ||
        !!(originalRequest?.headers?.Authorization || originalRequest?.headers?.authorization);

      if (hadAuth) {
        await handleTokenExpiration();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
