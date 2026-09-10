import { Routes, Route, Navigate } from "react-router";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import MainLayout from "./layouts/MainLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import AdminLayout from "./layouts/AdminLayout";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import UserDetails from "./pages/admin/UserDetails";
import AchievementManagement from "./pages/admin/AchievementManagement";
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

// Admin-only Route Guardian — waits for role to be sourced from the backend
// (Supabase session/JWT has no knowledge of it) before deciding.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isInitializing, isRoleLoading, user } =
    useAuthStore();

  if (isInitializing || (isAuthenticated && isRoleLoading)) {
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
  if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;
  return children;
};

function App() {
  const loginAction = useAuthStore((state) => state.login);
  const logoutAction = useAuthStore((state) => state.logout);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const setRoleLoading = useAuthStore((state) => state.setRoleLoading);

  useEffect(() => {
    const handleSession = async (session) => {
      // 1. If Supabase session is active, update login state
      if (session && session.user) {
        const meta = session.user.user_metadata || {};
        const userId = session.user.id;
        const cachedFrameId =
          meta.profile_frame_id ||
          localStorage.getItem(`profile_frame_id_${userId}`) ||
          localStorage.getItem("profile_frame_id") ||
          null;
        const cachedWallpaper =
          meta.wallpaper_url ||
          localStorage.getItem(`wallpaper_url_${userId}`) ||
          localStorage.getItem("wallpaper_url") ||
          null;

        const userEmail = session.user.email;
        if (session.access_token) {
          localStorage.setItem("access_token", session.access_token);
        }

        const baseUser = {
          ...session.user,
          ...meta,
          id: session.user.id,
          user_id: session.user.id,
          role: meta.role || "MEMBER",
          email: userEmail,
          avatar_url:
            meta.avatar_url ||
            meta.picture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail?.split("@")[0] || "User")}&background=1e293b&color=38bdf8`,
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
          user_metadata: {
            ...meta,
            profile_frame_id: cachedFrameId,
            wallpaper_url: cachedWallpaper,
          },
        };

        loginAction(baseUser);

        // Supabase's session doesn't know the Mongoose-side role/status, so
        // fetch and merge that in the background (see authService.getMe).
        try {
          const res = await authService.getMe();
          const dbUser = res?.data || res?.user || (res?.id ? res : null);
          
          if (dbUser) {
            loginAction({
              ...baseUser,
              ...dbUser,
              display_name: dbUser.nickname || dbUser.username || baseUser.display_name,
              user_metadata: {
                ...baseUser.user_metadata,
                ...dbUser.user_metadata,
                profile_frame_id:
                  dbUser.user_metadata?.profile_frame_id ||
                  dbUser.current_frame_id ||
                  baseUser.user_metadata?.profile_frame_id ||
                  cachedFrameId,
                wallpaper_url:
                  dbUser.user_metadata?.wallpaper_url ||
                  dbUser.wallpaper ||
                  baseUser.user_metadata?.wallpaper_url ||
                  cachedWallpaper,
              },
            });
          }
        } catch (e) {
          console.log("Background role sync notice:", e);
        } finally {
          setInitializing(false);
          setRoleLoading(false);
        }
        return;
      }

      // 2. If Supabase session is empty, check localStorage access_token
      const savedToken = localStorage.getItem("access_token");
      if (savedToken && savedToken !== "undefined" && savedToken !== "null") {
        const tokenUser = getUserFromToken(savedToken);
        if (tokenUser) {
          const userId = tokenUser.id || tokenUser.user_id;
          const cachedFrameId =
            tokenUser.user_metadata?.profile_frame_id ||
            localStorage.getItem(`profile_frame_id_${userId}`) ||
            localStorage.getItem("profile_frame_id") ||
            null;
          const cachedWallpaper =
            tokenUser.user_metadata?.wallpaper_url ||
            localStorage.getItem(`wallpaper_url_${userId}`) ||
            localStorage.getItem("wallpaper_url") ||
            null;

          const baseTokenUser = {
            ...tokenUser,
            user_metadata: {
              ...tokenUser.user_metadata,
              profile_frame_id: cachedFrameId,
              wallpaper_url: cachedWallpaper,
            },
          };

          // Token is valid and not expired -> keep user logged in!
          loginAction(baseTokenUser);

          // Asynchronously attempt to refresh user profile from server
          try {
            const res = await authService.getMe();
            const dbUser = res?.data || res?.user || (res?.id ? res : null);
            if (dbUser) {
              const finalUserId =
                dbUser.id || dbUser._id || dbUser.user_id || userId;
              loginAction({
                ...baseTokenUser,
                ...dbUser,
                id: finalUserId,
                user_id: finalUserId,
                user_metadata: {
                  ...baseTokenUser.user_metadata,
                  ...dbUser.user_metadata,
                  profile_frame_id:
                    dbUser.user_metadata?.profile_frame_id ||
                    dbUser.current_frame_id ||
                    baseTokenUser.user_metadata?.profile_frame_id ||
                    cachedFrameId,
                  wallpaper_url:
                    dbUser.user_metadata?.wallpaper_url ||
                    dbUser.wallpaper ||
                    baseTokenUser.user_metadata?.wallpaper_url ||
                    cachedWallpaper,
                },
              });
            }
          } catch (e) {
            console.log("Background getMe check notice:", e);
          } finally {
            setInitializing(false);
            setRoleLoading(false);
          }
          return;
        }
      }

      // 3. Token is missing or expired -> log out cleanly
      logoutAction();
      setInitializing(false);
      setRoleLoading(false);
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
        setRoleLoading(false);
      });

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        logoutAction();
        setInitializing(false);
        setRoleLoading(false);
      } else if (session) {
        const currentUser = useAuthStore.getState().user;
        // ป้องกันการรีโหลดหน้า/กระพริบ เมื่อสลับแท็บแล้ว Supabase ยิง event ซ้ำ
        if (!currentUser || currentUser.id !== session.user.id) {
          handleSession(session);
        } else if (session.access_token) {
          // อัปเดตเฉพาะ Token เงียบๆ ไม่ต้องโหลดโปรไฟล์ใหม่
          localStorage.setItem("access_token", session.access_token);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loginAction, logoutAction, setInitializing, setRoleLoading]);

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

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="achievements" element={<AchievementManagement />} />
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
