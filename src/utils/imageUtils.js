/**
 * Validates and normalizes an image URL for display.
 * Returns null if the URL is invalid, empty, or a bare filename that would 404.
 *
 * @param {string|null|undefined} url - The URL to inspect
 * @returns {string|null} - Safe URL to pass to <img src="..."> or null
 */
export function getValidImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }

  // Valid full HTTP(S) URL, root-relative path (e.g. /frames/...), data URI, or blob URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Bare filename (e.g. "xqu0rkrabazvmm10ykpf.png")
  // Do not return raw bare filenames because the browser would request them
  // relative to the current route (/admin/...) and result in a 404 error.
  return null;
}
