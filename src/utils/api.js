import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_BASE_URL || 'https://share-ed-backend-6jer.onrender.com/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token automatically from Supabase session
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        const fallbackToken = localStorage.getItem('access_token');
        if (fallbackToken && fallbackToken !== 'undefined' && fallbackToken !== 'null') {
          config.headers.Authorization = `Bearer ${fallbackToken}`;
        }
      }
    } catch (err) {
      console.error('Error fetching Supabase session in API interceptor:', err);
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
