import { Outlet } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useHeroThemeStore from '@/store/heroThemeStore';

export default function MainLayout() {
  // Set by whichever page is currently mounted (see useHeroThemeStore) based
  // on the actual brightness of its background image, not the route — so the
  // space reserved for the fixed navbar matches whatever wallpaper is behind it.
  const isDarkHero = useHeroThemeStore((state) => state.isDarkHero);

  return (
    <div className={`min-h-screen flex flex-col relative ${isDarkHero ? 'bg-slate-950' : 'bg-background'}`}>
      <Navbar />
      <div className="flex-1 pt-20 sm:pt-28 pb-20 sm:pb-24">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
