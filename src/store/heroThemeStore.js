import { create } from 'zustand';
import { getAverageBrightness } from '@/utils/imageBrightness';

// Brightness below this is treated as a "dark hero" — the navbar switches to
// its translucent dark/glass style so it stays readable over the image.
const DARK_THRESHOLD = 0.55;

// Lets a page with a full-bleed custom background (e.g. Profile's wallpaper)
// tell the navbar/layout what's behind it, so the navbar theme follows the
// actual image instead of being hardcoded per-route.
const useHeroThemeStore = create((set, get) => ({
  isDarkHero: false,
  requestId: 0,

  // `fallbackDark` is used when there's no image to sample (e.g. a page has
  // no custom wallpaper but still renders a dark-by-default backdrop).
  setHeroImage: (url, { fallbackDark = false } = {}) => {
    const requestId = get().requestId + 1;
    set({ requestId });

    if (!url) {
      set({ isDarkHero: fallbackDark });
      return;
    }

    getAverageBrightness(url)
      .then((brightness) => {
        if (get().requestId === requestId) {
          set({ isDarkHero: brightness < DARK_THRESHOLD });
        }
      })
      .catch(() => {
        // Can't sample it (CORS-blocked host, load failure, etc.) — default
        // to dark since these hero backgrounds are usually photos/gradients.
        if (get().requestId === requestId) {
          set({ isDarkHero: true });
        }
      });
  },

  clearHeroImage: () => set({ isDarkHero: false, requestId: get().requestId + 1 }),
}));

export default useHeroThemeStore;
