import { supabase } from '../utils/supabase';
import api from '../utils/api';

export const authService = {
  // Register user via Supabase Auth & Backend API sync
  register: async ({ email, password, username, education_level, age, bio }) => {
    // 1. Register with Supabase Auth
    const { data: supData, error: supError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          display_name: username || email.split('@')[0],
          full_name: username || email.split('@')[0],
          education_level: education_level || 'HIGH_SCHOOL',
          age: age || 0,
          bio: bio || 'ยังไม่ได้ระบุ'
        }
      }
    });

    if (supData?.session?.access_token) {
      localStorage.setItem('access_token', supData.session.access_token);
    }

    // 2. Sync with Backend API
    try {
      const regRes = await api.post('/auth/register', {
        email,
        password,
        confirmPassword: password,
        username: username || email.split('@')[0],
        nickname: username || email.split('@')[0],
        full_name: username || email.split('@')[0],
        education_level: education_level || 'HIGH_SCHOOL',
        age: age || 0,
        bio: bio || 'ยังไม่ได้ระบุ'
      });
      const bToken = regRes.data?.token || regRes.data?.access_token || regRes.data?.data?.token;
      if (bToken && !localStorage.getItem('access_token')) {
        localStorage.setItem('access_token', bToken);
      }
    } catch (bErr) {
      console.log('Backend auto-register notice:', bErr?.response?.data || bErr.message);
    }

    if (supError && !supData?.user) {
      const errMsg = supError.message || '';
      if (
        errMsg.toLowerCase().includes('already registered') ||
        errMsg.toLowerCase().includes('already exists')
      ) {
        throw new Error('อีเมลล์หรือชื่อผู้ใช้นี้เคยถูกใช้งานแล้ว');
      }
      throw supError;
    }

    return supData;
  },

  // Login user via Supabase Auth or Backend API fallback
  login: async (email, password) => {
    let supData = null;
    let supError = null;

    // 1. Try Supabase Auth
    try {
      const res = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      supData = res.data;
      supError = res.error;
    } catch (err) {
      supError = err;
    }

    if (!supError && supData?.session?.access_token) {
      localStorage.setItem('access_token', supData.session.access_token);

      // Sync login with backend API in background if needed
      try {
        await api.post('/auth/login', { email, password });
      } catch (e) { }

      return supData;
    }

    // 2. Fallback to Backend API if Supabase login fails
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data?.token || response.data?.access_token || response.data?.data?.token || response.data?.session?.access_token;
      if (token) {
        localStorage.setItem('access_token', token);
      }
      return response.data;
    } catch (backendError) {
      const msg = supError?.message || backendError?.response?.data?.message || backendError?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (msg.includes('Invalid login credentials') || msg.includes('Invalid credentials') || msg.includes('invalid_credentials')) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }
      if (msg.includes('Email not confirmed')) {
        throw new Error('กรุณายืนยันตัวตนผ่านอีเมลของคุณก่อนเข้าสู่ระบบ');
      }
      throw new Error(msg);
    }
  },

  // Get current user details
  getMe: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      const user = session.user;
      const meta = user.user_metadata || {};
      const cachedFrameId =
        meta.profile_frame_id ||
        localStorage.getItem(`profile_frame_id_${user.id}`) ||
        localStorage.getItem("profile_frame_id") ||
        null;
      const cachedWallpaper =
        meta.wallpaper_url ||
        localStorage.getItem(`wallpaper_url_${user.id}`) ||
        localStorage.getItem("wallpaper_url") ||
        null;

      const supabaseUser = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        name: meta.display_name || meta.full_name || meta.username || user.email?.split('@')[0],
        avatar: meta.avatar_url,
        display_name: meta.display_name || meta.full_name || meta.username,
        username: meta.username || meta.display_name || meta.full_name,
        education_level: meta.education_level,
        age: meta.age,
        bio: meta.bio,
        user_metadata: {
          ...meta,
          profile_frame_id: cachedFrameId,
          wallpaper_url: cachedWallpaper,
        }
      };

      // Supabase's session/JWT has no knowledge of the DB-side role/status/metadata,
      // so also ask the backend and merge all those fields in when available.
      try {
        const backendRes = await api.get('/auth/me');
        const backendUser = backendRes.data?.data || backendRes.data?.user || backendRes.data;
        if (backendUser) {
          Object.assign(supabaseUser, backendUser);
          supabaseUser.user_metadata = {
            ...meta,
            ...(backendUser.user_metadata || {}),
            profile_frame_id:
              backendUser.user_metadata?.profile_frame_id ||
              backendUser.current_frame_id ||
              cachedFrameId ||
              meta.profile_frame_id ||
              null,
            wallpaper_url:
              backendUser.user_metadata?.wallpaper_url ||
              backendUser.wallpaper ||
              cachedWallpaper ||
              meta.wallpaper_url ||
              null,
          };
        }
      } catch (e) {
        console.log('Background role sync via /auth/me failed:', e?.response?.data || e.message);
      }

      return { success: true, data: supabaseUser };
    }

    // Fallback: Check backend /auth/me
    try {
      const response = await api.get('/auth/me');
      const dbUser = response.data?.data || response.data?.user || response.data;
      if (dbUser) {
        const userId = dbUser.id || dbUser.user_id;
        const cachedFrameId =
          dbUser.user_metadata?.profile_frame_id ||
          dbUser.current_frame_id ||
          (userId ? localStorage.getItem(`profile_frame_id_${userId}`) : null) ||
          localStorage.getItem("profile_frame_id") ||
          null;
        const cachedWallpaper =
          dbUser.user_metadata?.wallpaper_url ||
          dbUser.wallpaper ||
          (userId ? localStorage.getItem(`wallpaper_url_${userId}`) : null) ||
          localStorage.getItem("wallpaper_url") ||
          null;

        dbUser.user_metadata = {
          ...(dbUser.user_metadata || {}),
          profile_frame_id: cachedFrameId,
          wallpaper_url: cachedWallpaper,
        };
      }
      return response.data;
    } catch (e) {
      return null;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => { });
    } catch (e) { }

    try {
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {
        return supabase.auth.signOut();
      });
    } catch (err) {
      console.error('Supabase signout error:', err);
    }

    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('login_timestamp');
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },

  // Change email and/or password
  updateAccount: async ({ email, password }) => {
    const payload = {};
    if (email) payload.email = email;
    if (password) payload.password = password;

    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;
    return data;
  }
};
