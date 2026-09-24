import axios from 'axios';
import { supabase } from './supabase.js';

const api = axios.create({
  // ดึงค่านำจาก Environment Variable เสมอ ไม่ว่าจะเป็น Dev หรือ Prod
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'https://share-ed-backend-6jer.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
// const api = axios.create({
//   baseURL: import.meta.env.PROD 
//     ? '/api/v1' 
//     : (import.meta.env.VITE_API_BASE_URL || 'https://share-ed-backend-6jer.onrender.com/api/v1'),
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });


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

      // If session exists but access_token is absent, try refresh
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
    // If 401 Authorization error and not retried yet, try refreshing the session
    const status = error.response?.status;
    const errorMsg = error.response?.data?.message || '';
    const isAuthError = status === 401 && (
      errorMsg.includes('Authorization header missing') ||
      errorMsg.includes('Invalid or expired token') ||
      errorMsg.includes('jwt')
    );

    if (isAuthError && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await supabase.auth.refreshSession();
        const newToken = data?.session?.access_token;
        if (newToken) {
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
        // Refresh failed, continue with rejection
      }
    }
    return Promise.reject(error);
  }
);

export default api;
