import { supabase } from '../utils/supabase';
import api from '../utils/api';

export const authService = {
  checkRegistrationAvailability: async ({ email, username }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const [emailResult, usernameResult] = await Promise.all([
      normalizedEmail
        ? supabase.from('users').select('user_id').eq('email', normalizedEmail).limit(1)
        : Promise.resolve({ data: [] }),
      normalizedUsername
        ? supabase.from('users').select('user_id').ilike('username', normalizedUsername).limit(1)
        : Promise.resolve({ data: [] })
    ]);

    // Anonymous clients may not have permission to read the users table.
    // In that case, defer uniqueness validation to POST /auth/register,
    // which checks the database securely and returns a field-specific error.
    if (emailResult.error || usernameResult.error) {
      return {
        emailAvailable: true,
        usernameAvailable: true,
        deferredToServer: true
      };
    }

    return {
      emailAvailable: !emailResult.data?.length,
      usernameAvailable: !usernameResult.data?.length
    };
  },

  // Register user via Supabase Auth & Backend API sync
  register: async ({ email, password, username, education_level, age, bio }) => {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    let registeredUser = null;

    // Register through the backend first so its database uniqueness constraint
    // remains the source of truth for both email and username.
    try {
      const regRes = await api.post('/auth/register', {
        email: normalizedEmail,
        password,
        confirmPassword: password,
        username: normalizedUsername,
        nickname: normalizedUsername,
        full_name: normalizedUsername,
        education_level: education_level || 'HIGH_SCHOOL',
        age: age || 0,
        bio: bio || 'ยังไม่ได้ระบุ'
      });
      registeredUser = regRes.data?.data || regRes.data?.user || null;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      const normalizedMessage = message.toLowerCase();
      const isDuplicate = normalizedMessage.includes('already registered') ||
        normalizedMessage.includes('already exists') ||
        normalizedMessage.includes('already in use') ||
        normalizedMessage.includes('unique constraint');

      if (isDuplicate && (normalizedMessage.includes('username') || normalizedMessage.includes('ชื่อผู้ใช้'))) {
        throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
      }
      if (isDuplicate) {
        throw new Error('อีเมลนี้ถูกใช้งานแล้ว รวมถึงบัญชีที่สมัครผ่าน Google');
      }
      throw new Error(message);
    }

    // The backend creates the Supabase Auth identity. Sign in here only to
    // establish the browser session after registration succeeds.
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (!signInError && sessionData?.session?.access_token) {
      return sessionData;
    }

    return { user: registeredUser, session: null, requiresLogin: true };
  },

  // Supabase is the single source of truth for the browser session.
  // Backend profile provisioning happens through authenticated /auth/me.
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.session?.access_token) throw error || new Error('ไม่พบ session หลังเข้าสู่ระบบ');
      return data;
    } catch (loginError) {
      const msg = loginError?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
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
    localStorage.removeItem('profile_frame_id');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      const user = session.user;
      const meta = { ...(user.user_metadata || {}) };
      delete meta.profile_frame_id;
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

    // Fallback: Check backend /auth/me only if a stored token exists
    const fallbackToken = localStorage.getItem('access_token');
    if (!fallbackToken || fallbackToken === 'undefined' || fallbackToken === 'null') {
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      const dbUser = response.data?.data || response.data?.user || response.data;
      if (dbUser) {
        const userId = dbUser.id || dbUser.user_id;
        const cachedWallpaper =
          dbUser.user_metadata?.wallpaper_url ||
          dbUser.wallpaper ||
          (userId ? localStorage.getItem(`wallpaper_url_${userId}`) : null) ||
          localStorage.getItem("wallpaper_url") ||
          null;

        dbUser.user_metadata = {
          ...(dbUser.user_metadata || {}),
          wallpaper_url: cachedWallpaper,
        };
        delete dbUser.user_metadata.profile_frame_id;
      }
      return response.data;
    } catch {
      return null;
    }
  },

  // Logout user
  logout: async () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('manual_logout', 'true');
      }
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {
        return supabase.auth.signOut();
      });
    } catch (err) {
      console.error('Supabase signout error:', err);
    }

    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('login_timestamp');
      localStorage.removeItem('profile_frame_id');
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },

  // Re-authenticate before allowing a sensitive account change.
  verifyCurrentPassword: async ({ password }) => {
    if (!password) {
      throw new Error('กรุณากรอกรหัสผ่านเดิม');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    if (userError || !email) {
      throw new Error('ไม่พบข้อมูลบัญชี กรุณาเข้าสู่ระบบใหม่');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session) {
      throw new Error('รหัสผ่านเดิมไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }

    return data;
  },

  // Change email and/or password
  updateAccount: async ({ password }) => {
    const payload = {};
    if (password) payload.password = password;

    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;
    return data;
  }
};
