import { create } from 'zustand';
import { getImageColorProfile } from '@/utils/imageBrightness';

// Brightness below this is treated as a "dark hero" — the navbar switches to
// its translucent dark/glass style so it stays readable over the image.
const DARK_THRESHOLD = 0.55;

const FALLBACK_DARK_COLOR = { r: 15, g: 23, b: 42 }; // slate-900
const FALLBACK_LIGHT_COLOR = { r: 255, g: 255, b: 255 };

// Lets a page with a full-bleed custom background (e.g. Profile's wallpaper)
// tell the navbar/layout what's behind it, so the navbar theme — and the
// tint of any frosted-glass surface reading `heroColor` — follows the actual
// image instead of being hardcoded per-route.
const useHeroThemeStore = create((set, get) => ({
  isDarkHero: false,
  heroColor: FALLBACK_LIGHT_COLOR,
  requestId: 0,

  // `fallbackDark` is used when there's no image to sample (e.g. a page has
  // no custom wallpaper but still renders a dark-by-default backdrop).
  setHeroImage: (url, { fallbackDark = false } = {}) => {
    const requestId = get().requestId + 1;
    set({ requestId });

    if (!url) {
      set({
        isDarkHero: fallbackDark,
        heroColor: fallbackDark ? FALLBACK_DARK_COLOR : FALLBACK_LIGHT_COLOR,
      });
      return;
    }

    getImageColorProfile(url)
      .then(({ brightness, r, g, b }) => {
        if (get().requestId === requestId) {
          set({ isDarkHero: brightness < DARK_THRESHOLD, heroColor: { r, g, b } });
        }
      })
      .catch(() => {
        // Can't sample it (CORS-blocked host, load failure, etc.) — default
        // to dark since these hero backgrounds are usually photos/gradients.
        if (get().requestId === requestId) {
          set({ isDarkHero: true, heroColor: FALLBACK_DARK_COLOR });
        }
      });
  },

  clearHeroImage: () =>
    set({ isDarkHero: false, heroColor: FALLBACK_LIGHT_COLOR, requestId: get().requestId + 1 }),
}));

export default useHeroThemeStore;
