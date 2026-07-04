import { Routes, Route, Navigate } from 'react-router';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Explore from './pages/Explore';
import CreatePost from './pages/CreatePost';
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PostDetails from './pages/PostDetails';
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
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    const syncAccountWithDatabase = async (session) => {
      if (!session || !session.user) {
        setInitializing(false);
        return;
      }

      const userEmail = session.user.email;
      const meta = session.user.user_metadata || {};

      const initialUser = {
        id: session.user.id,
        user_id: session.user.id,
        email: userEmail,
        name: meta.display_name || meta.full_name || meta.name || meta.username || userEmail?.split('@')[0],
        avatar: meta.avatar_url,
        display_name: meta.display_name || meta.full_name || meta.name || meta.username,
        username: meta.username || meta.display_name || meta.full_name || userEmail?.split('@')[0],
        education_level: meta.education_level,
        age: meta.age,
        bio: meta.bio,
        user_metadata: meta
      };

      loginAction(initialUser);

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
              const fixedPassword = "Google_OAuth_" + userEmail.toLowerCase() + "_Secret#2024!";
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
              
              // ลอง Login ด้วยรหัสผ่านรูปแบบคงตัวแบบต่าง ๆ
              let loggedIn = false;
              let loginRes;
              
              // 1. ลองตัวพิมพ์เล็ก (แนะนำ)
              const fixedPasswordLower = "Google_OAuth_" + userEmail.toLowerCase() + "_Secret#2024!";
              try {
                loginRes = await authService.login(userEmail, fixedPasswordLower);
                loggedIn = true;
              } catch (loginErr1) {
                // 2. ลองตัวพิมพ์ดั้งเดิมจาก Supabase
                const fixedPasswordOriginal = "Google_OAuth_" + userEmail + "_Secret#2024!";
                try {
                  loginRes = await authService.login(userEmail, fixedPasswordOriginal);
                  loggedIn = true;
                } catch (loginErr2) {
                  console.log("Both fixed password logins failed. Proposing password link.");
                }
              }

              if (loggedIn && loginRes) {
                const lToken = loginRes?.token || loginRes?.access_token || loginRes?.data?.token || loginRes?.data?.access_token;
                if (lToken) {
                  localStorage.setItem('access_token', lToken);
                  if (loginRes.user || loginRes.data) {
                    loginAction(loginRes.user || loginRes.data);
                  }
                  return;
                }
              }

              // 3. หากสมัครผ่านระบบปกติด้วยอีเมลนี้ไว้ก่อนหน้านี้ ให้ถามรหัสผ่านเพื่อเชื่อมบัญชี
              try {
                const { value: password } = await Swal.fire({
                  title: 'เชื่อมโยงบัญชีผู้ใช้',
                  text: 'อีเมลนี้ถูกลงทะเบียนด้วยรหัสผ่านในระบบไว้ก่อนแล้ว กรุณากรอกรหัสผ่านของคุณเพื่อเชื่อมโยงกับบัญชี Google',
                  input: 'password',
                  inputPlaceholder: 'กรอกรหัสผ่านบัญชี Share-ED ของคุณ',
                  inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                  },
                  showCancelButton: true,
                  confirmButtonText: 'เชื่อมโยงบัญชี',
                  cancelButtonText: 'ยกเลิก',
                  confirmButtonColor: '#1a2b4c',
                  allowOutsideClick: false,
                  inputValidator: (value) => {
                    if (!value) {
                      return 'กรุณากรอกรหัสผ่านของคุณ';
                    }
                  }
                });

                if (password) {
                  const linkRes = await authService.login(userEmail, password);
                  const lToken = linkRes?.token || linkRes?.access_token || linkRes?.data?.token || linkRes?.data?.access_token;
                  if (lToken) {
                    localStorage.setItem('access_token', lToken);
                    if (linkRes.user || linkRes.data) {
                      loginAction(linkRes.user || linkRes.data);
                    }
                    toast.success('เชื่อมโยงบัญชี Google สำเร็จ!');
                    return;
                  }
                } else {
                  await supabase.auth.signOut();
                  logoutAction();
                  toast.error('ยกเลิกการเข้าสู่ระบบ');
                }
              } catch (linkErr) {
                console.log("Account linking error:", linkErr);
                await supabase.auth.signOut();
                logoutAction();
                toast.error(linkErr.response?.data?.message || 'รหัสผ่านไม่ถูกต้อง ไม่สามารถเชื่อมโยงบัญชีได้');
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

    // Check active Supabase session on load
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
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />
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
