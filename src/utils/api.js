import axios from 'axios';
import { supabase } from './supabase';


const api = axios.create({
  // ดึงค่านำจาก Environment Variable เสมอ ไม่ว่าจะเป็น Dev หรือ Prod
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://share-ed-backend-6jer.onrender.com/api/v1',
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
  (config) => {
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

    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined' && token !== 'null') {
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

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
