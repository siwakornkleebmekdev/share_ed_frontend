import api from '../utils/api';
import { supabase } from '../utils/supabase';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change email and/or password for the currently signed-in user.
  updateAccount: async ({ email, password }) => {
    const payload = {};
    if (email) payload.email = email;
    if (password) payload.password = password;

    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;
    return data;
  }
};
