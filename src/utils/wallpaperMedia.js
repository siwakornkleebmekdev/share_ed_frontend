export const WALLPAPER_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "mp4"];
export const WALLPAPER_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4",
];
export const MAX_WALLPAPER_SIZE_BYTES = 25 * 1024 * 1024;

export const isMp4Wallpaper = (source, mimeType = "") => {
  if (String(mimeType).toLowerCase() === "video/mp4") return true;
  const cleanSource = String(source || "").split(/[?#]/, 1)[0];
  return /\.mp4$/i.test(cleanSource);
};

export const isSupportedWallpaperFile = (file) => {
  const extension = file?.name?.split(".").pop()?.toLowerCase() || "";
  const mimeType = String(file?.type || "").toLowerCase();
  return WALLPAPER_EXTENSIONS.includes(extension)
    && (!mimeType || WALLPAPER_MIME_TYPES.includes(mimeType));
};
