import { Outlet, useLocation, Link } from 'react-router';
import { PenTool } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  const location = useLocation();
  const hideFloatingButtonPaths = ['/create', '/login', '/register'];
  const showFloatingButton = !hideFloatingButtonPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      <Navbar />
      <div className="flex-1 pt-28">
        <Outlet />
      </div>
      <Footer />

      {showFloatingButton && (
        <Link 
          to="/create" 
          className="group fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex items-center justify-center bg-primary text-white p-4 rounded-full font-bold shadow-xl hover:bg-blue-600 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in slide-in-from-bottom-8 overflow-hidden"
        >
          <PenTool className="h-6 w-6" />
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-500 ease-in-out whitespace-nowrap">
            สร้างโพสต์
          </span>
        </Link>
      )}
    </div>
  );
}
