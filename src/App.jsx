import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense, useEffect, useRef } from "react";
import useAuthStore from "./store/authStore";
import useNotificationStore from "./store/notificationStore";
import MainLayout from "./layouts/MainLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import AdminLayout from "./layouts/AdminLayout";
import { authService } from "./services/auth.service";
import { supabase } from "./utils/supabase";
import { handleTokenExpiration } from "./utils/api";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Explore = lazy(() => import("./pages/Explore"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const EditPost = lazy(() => import("./pages/EditPost"));
const Trending = lazy(() => import("./pages/Trending"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Achievements = lazy(() => import("./pages/Achievements"));
const PostDetails = lazy(() => import("./pages/PostDetails"));
const SettingsProfile = lazy(() => import("./pages/settings/SettingsProfile"));
const SettingsWidgets = lazy(() => import("./pages/settings/SettingsWidgets"));
const SettingsAccount = lazy(() => import("./pages/settings/SettingsAccount"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const UserDetails = lazy(() => import("./pages/admin/UserDetails"));
const AchievementManagement = lazy(() => import("./pages/admin/AchievementManagement"));
const PostConsole = lazy(() => import("./pages/admin/PostConsole"));

const RouteLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-slate-500 font-medium">กำลังโหลดหน้า...</p>
  </div>
);

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

// Public-only routes must not be accessible once a session is active.
// This applies to every role; authorization is handled separately by AdminRoute.
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/home" replace />;
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

const ReviewerRoute = ({ children }) => {
  const { isAuthenticated, isInitializing, isRoleLoading, user } = useAuthStore();
  const role = String(user?.role || "").toUpperCase();

  if (isInitializing || (isAuthenticated && isRoleLoading)) return <RouteLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!["ADMIN", "MODERATOR"].includes(role)) return <Navigate to="/home" replace />;
  return children;
};

const AdminIndex = () => {
  const role = String(useAuthStore((state) => state.user?.role) || "").toUpperCase();
  return role === "ADMIN" ? <AdminDashboard /> : <Navigate to="/admin/reports" replace />;
};

function App() {
  const loginAction = useAuthStore((state) => state.login);
  const logoutAction = useAuthStore((state) => state.logout);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const setRoleLoading = useAuthStore((state) => state.setRoleLoading);
  const { connectRealtime, disconnectRealtime, fetchNotifications } = useNotificationStore();
  const prevUserId = useRef(null);
  const sessionVersion = useRef(0);

  useEffect(() => {
    // Remove the token mirror left by older builds. Supabase owns session
    // persistence and every authenticated transport reads from that session.
    localStorage.removeItem("access_token");

    const handleSession = async (session) => {
      const version = ++sessionVersion.current;
      // 1. If Supabase session is active, update login state
      if (session && session.user) {
        const meta = { ...(session.user.user_metadata || {}) };
        delete meta.profile_frame_id;
        localStorage.removeItem("profile_frame_id");
        const userId = session.user.id;
        const cachedWallpaper =
          meta.wallpaper_url ||
          localStorage.getItem(`wallpaper_url_${userId}`) ||
          localStorage.getItem("wallpaper_url") ||
          null;

        const userEmail = session.user.email;

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
            meta.username || meta.display_name || meta.full_name || meta.name || userEmail?.split("@")[0],
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
            wallpaper_url: cachedWallpaper,
          },
        };

        loginAction(baseUser);

        // Supabase's session doesn't know the Mongoose-side role/status, so
        // fetch and merge that in the background (see authService.getMe).
        try {
          const res = await authService.getMe();
          if (version !== sessionVersion.current) return;
          const dbUser = res?.data || res?.user || (res?.id ? res : null);
          
          if (dbUser) {
            loginAction({
              ...baseUser,
              ...dbUser,
              username: dbUser.username || baseUser.username,
              display_name: dbUser.username || baseUser.display_name,
              user_metadata: {
                ...baseUser.user_metadata,
                ...dbUser.user_metadata,
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
          if (version === sessionVersion.current) {
            setInitializing(false);
            setRoleLoading(false);
          }
        }
        return;
      }

      // Supabase is the browser-session authority.
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
        sessionVersion.current += 1;
        logoutAction();
        setInitializing(false);
        setRoleLoading(false);
      });

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        sessionVersion.current += 1;
        const wasAuthenticated = useAuthStore.getState().isAuthenticated;
        const isManual = typeof sessionStorage !== "undefined" && sessionStorage.getItem("manual_logout");
        logoutAction();
        setInitializing(false);
        setRoleLoading(false);
        if (wasAuthenticated && !isManual) {
          handleTokenExpiration();
        }
      } else if (session) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("manual_logout");
        }
        const currentUser = useAuthStore.getState().user;
        // ป้องกันการรีโหลดหน้า/กระพริบ เมื่อสลับแท็บแล้ว Supabase ยิง event ซ้ำ
        if (!currentUser || currentUser.id !== session.user.id) {
          handleSession(session);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loginAction, logoutAction, setInitializing, setRoleLoading]);

  // เชื่อมต่อ Socket.IO เมื่อ login และตัดการเชื่อมต่อเมื่อ logout
  useEffect(() => {
    const syncNotifications = (state) => {
      const userId = state.user?.id || state.user?.user_id;
      if (state.isAuthenticated && userId && userId !== prevUserId.current) {
        prevUserId.current = userId;
        connectRealtime(userId);

      } else if (!state.isAuthenticated && prevUserId.current) {
        prevUserId.current = null;
        disconnectRealtime();
      }
    };
    syncNotifications(useAuthStore.getState());
    const unsubscribe = useAuthStore.subscribe(syncNotifications);
    return () => { unsubscribe(); disconnectRealtime(); prevUserId.current = null; };
  }, [connectRealtime, disconnectRealtime, fetchNotifications]);

  return (
    <>
      <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/about" element={<Navigate to="/" replace />} />
          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <PostDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/edit/:id"
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            }
          />
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
          <Route path="/profile/:userId" element={<Profile />} />
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
          <Route
            path="/report-console"
            element={
              <ReviewerRoute>
                <Navigate to="/admin/reports" replace />
              </ReviewerRoute>
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
          <Route path="appearance" element={<Navigate to="/settings/profile" replace />} />
          <Route path="widgets" element={<SettingsWidgets />} />
          <Route path="account" element={<SettingsAccount />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ReviewerRoute>
              <AdminLayout />
            </ReviewerRoute>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="users/:id" element={<AdminRoute><UserDetails /></AdminRoute>} />
          <Route path="achievements" element={<AdminRoute><AchievementManagement /></AdminRoute>} />
          <Route path="posts" element={<Navigate to="/admin/reports" replace />} />
          <Route path="reports" element={<PostConsole />} />
        </Route>
      </Routes>
      </Suspense>

      <Toaster
        position="bottom-right"
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

