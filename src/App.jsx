import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';
import SettingsLayout from './layouts/SettingsLayout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import CreatePost from './pages/CreatePost';
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Achievements from './pages/Achievements';
import PostDetails from './pages/PostDetails';
import EditPost from './pages/EditPost';
import SettingsOverview from './pages/settings/SettingsOverview';
import SettingsProfile from './pages/settings/SettingsProfile';
import SettingsAppearance from './pages/settings/SettingsAppearance';
import SettingsAccount from './pages/settings/SettingsAccount';
import SettingsWidgets from './pages/settings/SettingsWidgets';
import { supabase } from './utils/supabase';
import api from './utils/api';
import { authService } from './services/auth.service';

// Route Guardian Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const loginAction = useAuthStore((state) => state.login);
  const logoutAction = useAuthStore((state) => state.logout);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // The backend's real /auth/login response nests the session under
    // `session` — e.g. { success, message, session: { access_token, user, ... } }
    // (confirmed by probing the live backend directly). The Google-login
    // fallback code below used to guess at flatter shapes (`token`,
    // `access_token`, `data.token`) that never matched this, so it always
    // treated a *successful* backend login as a failure and showed
    // "already registered with a password" even when login actually worked.
    const extractSession = (response) => {
      const session = response?.session || response?.data?.session;
      const token = session?.access_token || response?.token || response?.access_token || response?.data?.token || response?.data?.access_token;
      const user = session?.user || response?.user || response?.data?.user || response?.data;
      return { token, user };
    };

    const syncAccountWithDatabase = async (session) => {
      if (!session || !session.user) return;
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const userEmail = session.user.email;
        const meta = session.user.user_metadata || {};

        // เก็บ Token ของ Supabase ลง localStorage เพื่อใช้เป็น Header สำหรับส่งไป Backend
        if (session.access_token) {
          localStorage.setItem('access_token', session.access_token);
        }

        // เบื้องต้นใส่ข้อมูลจาก session ลง store ก่อนเพื่อความรวดเร็ว
        loginAction({
          id: session.user.id,
          email: userEmail,
          name: meta.display_name || meta.full_name || meta.username || userEmail,
          avatar: meta.avatar_url,
          display_name: meta.display_name || meta.full_name || meta.username,
          username: meta.username || meta.display_name || meta.full_name,
          education_level: meta.education_level,
          age: meta.age,
          bio: meta.bio,
          user_metadata: meta
        });

        // ตรวจสอบกับระบบหลังบ้านผ่าน API โดยตรง (เพื่อให้อีเมลที่สมัครไว้แล้วใช้บัญชีเดียวกัน และไม่ติด 403 RLS ของ Supabase)
        try {
          const res = await authService.getMe();
          if (res) {
            const dbUser = res.data || res.user || res;
            const mergedEdu = dbUser.education_level || meta.education_level;
            const mergedAge = dbUser.age || meta.age;
            const mergedBio = dbUser.bio || meta.bio;
            const mergedUsername = dbUser.username || dbUser.nickname || meta.display_name || meta.username || meta.full_name || userEmail?.split('@')[0];

            loginAction({
              ...dbUser,
              id: dbUser.id || dbUser._id || session.user.id,
              user_id: dbUser.id || dbUser._id || session.user.id,
              email: userEmail,
              name: mergedUsername,
              avatar: dbUser.avatar_url || meta.avatar_url,
              display_name: mergedUsername,
              username: mergedUsername,
              education_level: mergedEdu,
              age: mergedAge,
              bio: mergedBio,
              user_metadata: {
                ...meta,
                ...dbUser,
                education_level: mergedEdu,
                age: mergedAge,
                bio: mergedBio,
                username: mergedUsername
              }
            });

            // อัปเดต sync ทั้งในตาราง users และใน Supabase auth
            if (mergedEdu) {
              supabase.from('users').update({
                education_level: mergedEdu,
                age: mergedAge || null,
                bio: mergedBio || null,
                updated_at: new Date()
              }).eq('id', session.user.id).catch(() => {});

              supabase.auth.updateUser({
                data: {
                  education_level: mergedEdu,
                  age: mergedAge || 0,
                  bio: mergedBio || " ",
                  username: mergedUsername
                }
              }).catch(() => {});
            }
            return;
          }
        } catch (err) {
          // ถ้าดึง getMe() ไม่ได้ เช่น เข้าด้วย Google ครั้งแรก หรือ token ยังไม่ตรงกันกับระบบหลังบ้าน
          const isGoogleLogin = session.user.app_metadata?.provider === 'google' || session.user.user_metadata?.iss?.includes('google') || session.user.app_metadata?.providers?.includes('google');
          if (isGoogleLogin) {
            // ลองเรียก /auth/google ของระบบหลังบ้านก่อน เผื่อมีในอนาคต (ตอนนี้ยังไม่มี — ยืนยันแล้วว่า 404 จริง)
            try {
              const gRes = await api.post('/auth/google', {
                email: userEmail,
                name: meta.display_name || meta.full_name || meta.name || userEmail?.split('@')[0],
                avatar: meta.avatar_url
              });
              const { token: gToken, user: gUser } = extractSession(gRes.data);
              if (gToken) {
                localStorage.setItem('access_token', gToken);
                loginAction(gUser);
                return;
              }
            } catch (gErr) {
              // ไม่ถือว่าร้ายแรง — backend ยังไม่มี endpoint sync บัญชี Google โดยเฉพาะ
              // สำคัญ: จุดนี้ "ไม่" ลองสมัครสมาชิกด้วยรหัสผ่านที่สร้างขึ้นเองอีกต่อไป —
              // เพราะ Supabase เป็นเจ้าของอีเมลนี้อยู่แล้วทันทีที่ Google OAuth เสร็จสิ้น
              // ทำให้ /auth/register ปฏิเสธด้วย "อีเมลนี้ถูกใช้งานแล้ว" เสมอ (ยืนยันจริงจากการทดสอบ
              // backend ตรงๆ) แม้จะเป็นอีเมลที่ไม่เคยสมัครมาก่อนเลยก็ตาม โค้ดเดิมตีความ error
              // นี้ผิดว่า "มีบัญชีรหัสผ่านอยู่แล้ว" แล้ว sign out ผู้ใช้ทันที — นี่คือบั๊กตัวจริงที่
              // ทำให้ทุกการ login ด้วย Google เด้งออกภายในไม่กี่วินาที
              console.log('ยังไม่มี /auth/google บน backend — ใช้ข้อมูลจาก Supabase session ต่อไปโดยไม่ sign out', gErr?.response?.data || gErr.message);
            }

            // ยังไม่มี endpoint ฝั่ง backend สำหรับสร้าง/เชื่อมบัญชีจาก Google โดยตรง
            // (ต้องแก้ที่ backend ในอนาคต) — แต่ Supabase session ที่ได้มาถูกต้องแล้ว
            // จึงปล่อยให้ผู้ใช้ยังคง login อยู่ด้วยข้อมูลจาก Supabase (ที่ตั้งไว้ optimistic
            // ด้านบนแล้ว) แทนการบังคับ sign out — ฟีเจอร์ที่ต้องพึ่ง backend โดยตรงอาจ
            // ยังใช้ไม่ได้จนกว่าจะมี endpoint นี้ แต่ผู้ใช้จะไม่ถูกเด้งออกอีก
            return;
          }
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Check active session on load
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getMe().then((res) => {
        if (res) {
          const dbUser = res.data || res.user || res;
          loginAction({
            ...dbUser,
            id: dbUser.id || dbUser._id || dbUser.user_id,
            user_id: dbUser.id || dbUser._id || dbUser.user_id
          });
        }
      }).catch(() => {});
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncAccountWithDatabase(session);
      }
    });

    // Listen for auth changes (like returning from Google Login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncAccountWithDatabase(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [loginAction, logoutAction]);

  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route 
            path="/post/edit/:id" 
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            } 
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route path="/profile/edit" element={<Navigate to="/settings/profile" replace />} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SettingsOverview />} />
          <Route path="profile" element={<SettingsProfile />} />
          <Route path="appearance" element={<SettingsAppearance />} />
          <Route path="widgets" element={<SettingsWidgets />} />
          <Route path="account" element={<SettingsAccount />} />
        </Route>
      </Routes>

      <Toaster position="bottom-center" toastOptions={{
        style: {
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
          fontWeight: '500',
        },
      }} />
    </>
  );
}

export default App;
