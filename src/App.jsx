import { Routes, Route, Navigate } from "react-router";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import MainLayout from "./layouts/MainLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Trending from "./pages/Trending";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Achievements from "./pages/Achievements";
import PostDetails from "./pages/PostDetails";
import SettingsProfile from "./pages/settings/SettingsProfile";
import SettingsAppearance from "./pages/settings/SettingsAppearance";
import SettingsWidgets from "./pages/settings/SettingsWidgets";
import SettingsAccount from "./pages/settings/SettingsAccount";
import { authService } from "./services/auth.service";
import { supabase } from "./utils/supabase";

// Helper to decode JWT token payload safely
const getUserFromToken = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(jsonPayload);

    // Check if token expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    const meta = payload.user_metadata || payload.app_metadata || {};
    const userId = payload.sub || payload.id || payload.user_id;

    return {
      id: userId,
      user_id: userId,
      email: payload.email || meta.email || "",
      name:
        meta.display_name ||
        meta.full_name ||
        meta.name ||
        meta.username ||
        payload.email?.split("@")[0] ||
        "ผู้ใช้งาน",
      avatar: meta.avatar_url || payload.avatar,
      display_name:
        meta.display_name ||
        meta.full_name ||
        meta.name ||
        meta.username ||
        payload.email?.split("@")[0] ||
        "ผู้ใช้งาน",
      username:
        meta.username ||
        meta.display_name ||
        meta.full_name ||
        payload.email?.split("@")[0] ||
        "ผู้ใช้งาน",
      education_level:
        meta.education_level || payload.education_level || "HIGH_SCHOOL",
      age: meta.age || payload.age || 0,
      bio: meta.bio || payload.bio || "ยังไม่ได้ระบุ",
      user_metadata: meta,
    };
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
};

// Route Guardian Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">
            กำลังโหลดข้อมูล...
          </p>
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
    const handleSession = async (session) => {
      // 1. If Supabase session is active, update login state
      if (session && session.user) {
        const userEmail = session.user.email;
        const meta = session.user.user_metadata || {};

        if (session.access_token) {
          localStorage.setItem("access_token", session.access_token);
        }

        loginAction({
          id: session.user.id,
          user_id: session.user.id,
          email: userEmail,
          name:
            meta.display_name ||
            meta.full_name ||
            meta.name ||
            meta.username ||
            userEmail?.split("@")[0],
          avatar: meta.avatar_url,
          display_name:
            meta.display_name || meta.full_name || meta.name || meta.username,
          username:
            meta.username ||
            meta.display_name ||
            meta.full_name ||
            userEmail?.split("@")[0],
          education_level: meta.education_level || "HIGH_SCHOOL",
          age: meta.age || 0,
          bio: meta.bio || "ยังไม่ได้ระบุ",
          user_metadata: meta,
        });

        setInitializing(false);
        return;
      }

      // 2. If Supabase session is empty, check localStorage access_token
      const savedToken = localStorage.getItem("access_token");
      if (savedToken && savedToken !== "undefined" && savedToken !== "null") {
        const tokenUser = getUserFromToken(savedToken);
        if (tokenUser) {
          // Token is valid and not expired -> keep user logged in!
          loginAction(tokenUser);
          setInitializing(false);

          // Asynchronously attempt to refresh user profile from server
          try {
            const res = await authService.getMe();
            if (res && (res.data || res.user)) {
              const dbUser = res.data || res.user;
              loginAction({
                ...tokenUser,
                ...dbUser,
                id: dbUser.id || dbUser._id || dbUser.user_id || tokenUser.id,
                user_id:
                  dbUser.id || dbUser._id || dbUser.user_id || tokenUser.id,
              });
            }
          } catch (e) {
            console.log("Background getMe check notice:", e);
          }
          return;
        }
      }

      // 3. Token is missing or expired -> log out cleanly
      logoutAction();
      setInitializing(false);
    };

    // Initial check of Supabase session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        handleSession(session);
      })
      .catch(() => {
        const savedToken = localStorage.getItem("access_token");
        const tokenUser = getUserFromToken(savedToken);
        if (tokenUser) {
          loginAction(tokenUser);
        } else {
          logoutAction();
        }
        setInitializing(false);
      });

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        logoutAction();
        setInitializing(false);
      } else if (session) {
        handleSession(session);
      }
    });

    return () => subscription.unsubscribe();
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
          <Route
            path="/profile/edit"
            element={<Navigate to="/settings/profile" replace />}
          />
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
          <Route path="profile" element={<SettingsProfile />} />
          <Route path="appearance" element={<SettingsAppearance />} />
          <Route path="widgets" element={<SettingsWidgets />} />
          <Route path="account" element={<SettingsAccount />} />
        </Route>
      </Routes>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#333",
            color: "#fff",
            fontWeight: "500",
          },
        }}
      />
    </>
  );
}

export default App;
