import { Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import toast, {Toaster} from 'react-hot-toast';
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
        // Ignored; Supabase session user object is already in store
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
