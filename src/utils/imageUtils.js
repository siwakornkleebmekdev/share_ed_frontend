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

/**
 * Prepares and normalizes SVG text for canvas rendering.
 * Ensures xmlns, viewBox, and explicit target width & height.
 */
function prepareSvgString(svgText, targetWidth = 512, targetHeight = 512) {
  if (typeof svgText !== "string" || !svgText.trim()) return svgText;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return svgText;

    if (!svgEl.getAttribute("xmlns")) {
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    const currentVb = svgEl.getAttribute("viewBox");
    if (!currentVb) {
      const rawW = parseFloat(svgEl.getAttribute("width")) || targetWidth;
      const rawH = parseFloat(svgEl.getAttribute("height")) || targetHeight;
      svgEl.setAttribute("viewBox", `0 0 ${rawW} ${rawH}`);
    }

    svgEl.setAttribute("width", String(targetWidth));
    svgEl.setAttribute("height", String(targetHeight));

    return new XMLSerializer().serializeToString(doc);
  } catch (err) {
    console.warn("prepareSvgString fallback:", err);
    if (!svgText.includes("width=") && !svgText.includes("height=")) {
      return svgText.replace(
        /<svg\b([^>]*)>/i,
        `<svg $1 width="${targetWidth}" height="${targetHeight}">`
      );
    }
    return svgText;
  }
}

/**
 * Automatically converts an SVG File object to a high-res transparent PNG File in browser canvas.
 * This solves backend multipart upload restrictions where the server rejects .svg files.
 *
 * @param {File} svgFile - The source SVG File
 * @param {number} width - Output width (default: 512)
 * @param {number} height - Output height (default: 512)
 * @returns {Promise<File>} - Converted PNG File (or original if not SVG / conversion fails)
 */
export async function convertSvgToPngFile(svgFile, width = 512, height = 512) {
  if (!svgFile || typeof window === "undefined") return svgFile;
  const isSvg =
    svgFile.type === "image/svg+xml" ||
    (svgFile.name && svgFile.name.toLowerCase().endsWith(".svg"));
  if (!isSvg) return svgFile;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result;
      if (typeof svgText !== "string") {
        resolve(svgFile);
        return;
      }

      const preparedSvg = prepareSvgString(svgText, width, height);
      const blob = new Blob([preparedSvg], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";

      const renderCanvas = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            resolve(svgFile);
            return;
          }
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(blobUrl);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              resolve(svgFile);
              return;
            }
            const baseName = svgFile.name
              ? svgFile.name.replace(/\.svg$/i, "")
              : "reward_image";
            const pngFile = new File([pngBlob], `${baseName}.png`, {
              type: "image/png",
            });
            resolve(pngFile);
          }, "image/png");
        } catch (canvasErr) {
          console.warn("Canvas rendering failed, falling back to original SVG:", canvasErr);
          URL.revokeObjectURL(blobUrl);
          resolve(svgFile);
        }
      };

      img.onload = renderCanvas;

      img.onerror = () => {
        // Fallback: try data URI if blob URL failed
        try {
          const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preparedSvg)}`;
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = "anonymous";
          fallbackImg.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                URL.revokeObjectURL(blobUrl);
                resolve(svgFile);
                return;
              }
              ctx.clearRect(0, 0, width, height);
              ctx.drawImage(fallbackImg, 0, 0, width, height);
              URL.revokeObjectURL(blobUrl);

              canvas.toBlob((pngBlob) => {
                if (!pngBlob) {
                  resolve(svgFile);
                  return;
                }
                const baseName = svgFile.name
                  ? svgFile.name.replace(/\.svg$/i, "")
                  : "reward_image";
                const pngFile = new File([pngBlob], `${baseName}.png`, {
                  type: "image/png",
                });
                resolve(pngFile);
              }, "image/png");
            } catch (_) {
              URL.revokeObjectURL(blobUrl);
              resolve(svgFile);
            }
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(svgFile);
          };
          fallbackImg.src = dataUri;
        } catch (_) {
          URL.revokeObjectURL(blobUrl);
          resolve(svgFile);
        }
      };

      img.src = blobUrl;
    };

    reader.onerror = () => resolve(svgFile);
    reader.readAsText(svgFile);
  });
}

/**
 * Fetches an SVG URL from the web/public folder and converts it to a transparent PNG File.
 *
 * @param {string} svgUrl - The URL of the SVG (e.g. /frames/frame-gold-luxury.svg)
 * @param {string} fileName - Destination filename
 * @param {number} width - Output width (default: 512)
 * @param {number} height - Output height (default: 512)
 * @returns {Promise<File|null>} - Converted PNG File or null
 */
export async function convertSvgUrlToPngFile(
  svgUrl,
  fileName = "frame.png",
  width = 512,
  height = 512
) {
  if (!svgUrl || typeof svgUrl !== "string" || typeof window === "undefined") return null;

  try {
    const res = await fetch(svgUrl);
    const svgText = await res.text();
    const preparedSvg = prepareSvgString(svgText, width, height);
    const blob = new Blob([preparedSvg], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const renderToPng = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            resolve(null);
            return;
          }
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(blobUrl);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              resolve(null);
              return;
            }
            const cleanName = fileName.replace(/\.svg$/i, "") + ".png";
            const pngFile = new File([pngBlob], cleanName, { type: "image/png" });
            resolve(pngFile);
          }, "image/png");
        } catch (_) {
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        }
      };

      img.onload = renderToPng;
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };
      img.src = blobUrl;
    });
  } catch (err) {
    console.warn("Could not fetch or convert SVG URL:", err);
    return null;
  }
}
