import { Routes, Route, Navigate } from 'react-router';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';
import SettingsLayout from './layouts/SettingsLayout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Explore from './pages/Explore';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Achievements from './pages/Achievements';
import PostDetails from './pages/PostDetails';
import SetupProfileFirstTime from './components/SetupProfileFirstTime';
import { supabase } from './utils/supabase';
import api from './utils/api';
import { authService } from './services/auth.service';

// Route Guardian Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const loginAction = useAuthStore((state) => state.login);
  const logoutAction = useAuthStore((state) => state.logout);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const syncAccountWithDatabase = async (session) => {
      if (!session || !session.user) return;
      const userEmail = session.user.email;
      const meta = session.user.user_metadata || {};

      // เก็บ Token ของ Supabase ลง localStorage เพื่อใช้เป็น Header สำหรับส่งไป Backend
      if (session.access_token) {
        const curToken = localStorage.getItem('access_token');
        if (!curToken || curToken === 'undefined' || curToken === 'null') {
          localStorage.setItem('access_token', session.access_token);
        }
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
        if (res && (res.data || res.user)) {
          const dbUser = res.data || res.user;
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
        if (session.user.app_metadata?.provider === 'google' || session.user.user_metadata?.iss?.includes('google') || session.user.app_metadata?.providers?.includes('google')) {
          try {
            // ลองเรียก /auth/google ของระบบหลังบ้านก่อน (ถ้ามี)
            const gRes = await api.post('/auth/google', {
              email: userEmail,
              name: meta.display_name || meta.full_name || meta.name || userEmail?.split('@')[0],
              avatar: meta.avatar_url
            });
            const gToken = gRes.data?.token || gRes.data?.access_token || gRes.data?.data?.token || gRes.data?.data?.access_token;
            if (gToken) {
              localStorage.setItem('access_token', gToken);
              loginAction(gRes.data.user || gRes.data.data);
              return;
            }
          } catch (gErr) {
            // ถ้าไม่มี endpoint /auth/google ให้ใช้ authService.register ลงทะเบียนเข้า Node.js backend ทันที เพื่อไม่ให้ติด 401 เมื่อไปหน้า Profile
            try {
              const fixedPassword = "Google_OAuth_" + userEmail + "_Secret#2024!";
              const uname = meta.display_name || meta.full_name || meta.name || userEmail?.split('@')[0];
              const regData = await authService.register({
                email: userEmail,
                password: fixedPassword,
                confirmPassword: fixedPassword,
                username: uname,
                nickname: uname,
                full_name: uname,
                education_level: "MIDDLE_SCHOOL",
                age: 0,
                bio: "ยังไม่ได้ระบุ"
              });
              const regToken = regData?.token || regData?.access_token || regData?.data?.token || regData?.data?.access_token;
              if (regToken) {
                localStorage.setItem('access_token', regToken);
                loginAction(regData.user || regData.data || {
                  email: userEmail,
                  name: uname,
                  display_name: uname,
                  username: uname,
                  education_level: "MIDDLE_SCHOOL",
                  age: 0,
                  bio: "ยังไม่ได้ระบุ"
                });
                return;
              }
            } catch (regErr) {
              console.log("Google auto-register notice:", regErr?.response?.data || regErr.message);
              try {
                const fixedPassword = "Google_OAuth_" + userEmail + "_Secret#2024!";
                const loginRes = await authService.login(userEmail, fixedPassword);
                const lToken = loginRes?.token || loginRes?.access_token || loginRes?.data?.token || loginRes?.data?.access_token;
                if (lToken) {
                  localStorage.setItem('access_token', lToken);
                  if (loginRes.user || loginRes.data) {
                    loginAction(loginRes.user || loginRes.data);
                  }
                  return;
                }
              } catch (loginErr) {
                console.log("Fallback google login failed:", loginErr?.response?.data || loginErr.message);
              }
              if (session.access_token) {
                const curToken = localStorage.getItem('access_token');
                if (!curToken || curToken === 'undefined' || curToken === 'null') {
                  localStorage.setItem('access_token', session.access_token);
                }
              }
            }
          }
        }
      }
    };

    // Check active session on load
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getMe().then((res) => {
        if (res && (res.data || res.user)) {
          const dbUser = res.data || res.user;
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
      } else {
        const fallbackToken = localStorage.getItem('access_token');
        if (fallbackToken) {
          authService.getMe().then((res) => {
            if (res && (res.data || res.user)) {
              const dbUser = res.data || res.user;
              loginAction({
                ...dbUser,
                id: dbUser.id || dbUser._id || dbUser.user_id,
                user_id: dbUser.id || dbUser._id || dbUser.user_id
              });
            } else {
              setInitializing(false);
            }
          }).catch(() => {
            setInitializing(false);
          });
        } else {
          setInitializing(false);
        }
      }
    }).catch(() => {
      setInitializing(false);
    });

    // Listen for auth changes (like returning from Google Login or logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        syncAccountWithDatabase(session);
      } else if (event === 'SIGNED_OUT') {
        logoutAction();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loginAction, logoutAction, setInitializing]);

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
          <Route path="/reset-password" element={<ResetPassword />} />
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

      {/* Modal สำหรับอัปเดตโปรไฟล์ครั้งแรก (Age, Education Level, Bio) เมื่อผู้ใช้งานเข้าสู่ระบบแล้วแต่ยังไม่มีข้อมูล */}
      <SetupProfileFirstTime />

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
