import { create } from "zustand";

export function createBookmarkStatusStore(loadBookmarks, getUserId) {
  let flight = null;
  let flightOwner = null;
  let revision = 0;
  const touched = new Map();

  return create((set, get) => ({
    ownerId: null,
    ids: new Set(),
    loaded: false,

    clear: () => {
      revision += 1;
      flight = null;
      flightOwner = null;
      touched.clear();
      set({ ownerId: null, ids: new Set(), loaded: false });
    },

    ensureLoaded: () => {
      const userId = getUserId();
      if (!userId) {
        get().clear();
        return Promise.resolve();
      }
      if (get().ownerId !== userId) {
        revision += 1;
        flight = null;
        flightOwner = null;
        touched.clear();
        set({ ownerId: userId, ids: new Set(), loaded: false });
      }
      if (get().loaded) return Promise.resolve();
      if (flight && flightOwner === userId) return flight;

      const requestRevision = revision;
      flightOwner = userId;
      flight = Promise.resolve().then(loadBookmarks).then((bookmarks) => {
        if (revision !== requestRevision || getUserId() !== userId) return;
        const ids = new Set(bookmarks.map((item) => item.post_id || item.postId || item.post?.id).filter(Boolean).map(String));
        for (const [id, bookmarked] of touched) {
          if (bookmarked) ids.add(id);
          else ids.delete(id);
        }
        set({ ids, loaded: true });
      }).catch(() => {
        // Leave the list usable; a later mount or navigation can retry.
      }).finally(() => {
        if (revision === requestRevision) {
          flight = null;
          flightOwner = null;
        }
      });
      return flight;
    },

    setBookmarked: (postId, bookmarked) => {
      const userId = getUserId();
      if (!userId || !postId) return;
      if (get().ownerId !== userId) {
        revision += 1;
        flight = null;
        flightOwner = null;
        touched.clear();
        set({ ownerId: userId, ids: new Set(), loaded: false });
      }
      const id = String(postId);
      touched.set(id, Boolean(bookmarked));
      set((state) => {
        const ids = new Set(state.ids);
        if (bookmarked) ids.add(id);
        else ids.delete(id);
        return { ids };
      });
    },
  }));
}
